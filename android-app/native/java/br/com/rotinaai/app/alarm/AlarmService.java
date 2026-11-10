package br.com.rotinaai.app.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.Ringtone;
import android.media.ToneGenerator;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.Settings;
import android.speech.tts.TextToSpeech;
import android.speech.tts.UtteranceProgressListener;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Rings like an alarm clock: repeated beeps + the reminder spoken out loud, in a loop,
 * until the user answers ("Já fiz" or "Adiar"). Shows a full-screen alarm over the lock
 * screen / other apps. After 10 minutes without an answer it snoozes itself for 10 minutes.
 */
public class AlarmService extends Service {
    public static final String ACTION_START = "br.com.rotinaai.app.ALARM_START";
    public static final String ACTION_ANSWERED = "br.com.rotinaai.app.ALARM_ANSWERED";
    public static final String EXTRA_KEY = "key";
    public static final String CHANNEL_ID = "rotina_alarmes_v1";
    public static final int NOTIFICATION_ID = 4200;

    private static final long MAX_RING_MS = 10 * 60 * 1000;
    private static final long AUTO_SNOOZE_MS = 10 * 60 * 1000;
    private static final int BEEPS_PER_CYCLE = 6;
    private static final long BEEP_INTERVAL_MS = 650;

    /** Alarm currently ringing (read by AlarmActivity). */
    public static volatile JSONObject current;

    private final List<JSONObject> queue = new ArrayList<>();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private ToneGenerator tone;
    private AudioTrack track;
    private Ringtone ringtone;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private PowerManager.WakeLock wakeLock;
    private long ringStartedAt;
    private int cycleId = 0;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel(this);
        tts = new TextToSpeech(this, status -> {
            if (status == TextToSpeech.SUCCESS) {
                int r = tts.setLanguage(new Locale("pt", "BR"));
                ttsReady = r != TextToSpeech.LANG_MISSING_DATA && r != TextToSpeech.LANG_NOT_SUPPORTED;
                if (Build.VERSION.SDK_INT >= 21) {
                    tts.setAudioAttributes(new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_ALARM)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                            .build());
                }
                tts.setSpeechRate(0.95f);
            }
        });
    }

    public static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (nm == null || nm.getNotificationChannel(CHANNEL_ID) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_ID, "Alarmes do Rotina.ai", NotificationManager.IMPORTANCE_HIGH);
        ch.setDescription("Rotinas, compromissos e remédios no horário");
        ch.setSound(null, null); // the service plays the alarm sound itself
        ch.enableVibration(false);
        ch.setBypassDnd(true);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        nm.createNotificationChannel(ch);
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        String action = intent != null ? intent.getAction() : null;
        if (ACTION_START.equals(action)) {
            try {
                JSONObject alarm = new JSONObject(intent.getStringExtra(AlarmReceiver.EXTRA_ALARM));
                queue.add(alarm);
            } catch (Exception ignored) {
            }
            if (current == null && !queue.isEmpty()) {
                ringNext();
            } else if (current != null) {
                // keep foreground notification of the current alarm
                startInForeground(current);
            } else {
                stopSelf();
            }
        } else if (ACTION_ANSWERED.equals(action)) {
            String key = intent.getStringExtra(EXTRA_KEY);
            if (current != null && (key == null || key.equals(current.optString("key")))) {
                stopRinging();
                current = null;
                if (!queue.isEmpty()) ringNext();
                else {
                    stopForegroundCompat();
                    stopSelf();
                }
            } else if (current == null) {
                stopSelf();
            }
        } else if (current == null) {
            stopSelf();
        }
        return START_NOT_STICKY;
    }

    private void ringNext() {
        current = queue.remove(0);
        startInForeground(current);
        openFullScreen(current);
        acquireWakeLock();
        ringStartedAt = System.currentTimeMillis();
        cycleId++;
        runCycle(cycleId);
    }

    private void startInForeground(JSONObject alarm) {
        Notification n = buildNotification(alarm);
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, n);
        }
    }

    private Notification buildNotification(JSONObject alarm) {
        int piFlags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        Intent full = new Intent(this, AlarmActivity.class);
        full.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION);
        PendingIntent fullPi = PendingIntent.getActivity(this, 1, full, piFlags);

        String title = alarm.optString("title", "Lembrete");
        String time = alarm.optString("timeLabel", "");
        NotificationCompat.Builder b = new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle(alarm.optString("heading", "Rotina.ai"))
                .setContentText((time.isEmpty() ? "" : time + " • ") + title)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setOngoing(true)
                .setAutoCancel(false)
                .setContentIntent(fullPi)
                .setFullScreenIntent(fullPi, true)
                .addAction(0, "✔ Já fiz", ActionReceiver.pending(this, alarm, ActionReceiver.ACTION_DONE, 0, 10))
                .addAction(0, "Adiar 10 min", ActionReceiver.pending(this, alarm, ActionReceiver.ACTION_SNOOZE, 10, 11));
        return b.build();
    }

    /** Shows the alarm screen over other apps (needs "display over other apps" when the phone is in use). */
    private void openFullScreen(JSONObject alarm) {
        boolean canOverlay = Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(this);
        if (!canOverlay) return; // the full-screen intent of the notification covers the lock screen case
        try {
            Intent i = new Intent(this, AlarmActivity.class);
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_NO_USER_ACTION | Intent.FLAG_ACTIVITY_REORDER_TO_FRONT);
            startActivity(i);
        } catch (Exception ignored) {
        }
    }

    private void acquireWakeLock() {
        try {
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null && (wakeLock == null || !wakeLock.isHeld())) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "RotinaAI:alarm");
                wakeLock.acquire(MAX_RING_MS + 60 * 1000);
            }
        } catch (Exception ignored) {
        }
    }

    /** One cycle = a burst of beeps + vibration, then the spoken reminder; repeats. */
    private void runCycle(final int id) {
        if (id != cycleId || current == null) return;
        if (System.currentTimeMillis() - ringStartedAt > MAX_RING_MS) {
            // No answer: snooze automatically so it keeps insisting later
            JSONObject alarm = current;
            AlarmStore.addSnooze(this, alarm, System.currentTimeMillis() + AUTO_SNOOZE_MS);
            AlarmStore.scheduleNext(this);
            Intent stop = new Intent(this, AlarmService.class);
            stop.setAction(ACTION_ANSWERED);
            stop.putExtra(EXTRA_KEY, alarm.optString("key"));
            onStartCommand(stop, 0, 0);
            AlarmActivity.closeIfOpen(this);
            return;
        }
        vibrate();
        // Sound chosen in Configurações (padrao = original beeps)
        String sound = current.optString("sound", "padrao");
        long soundMs;
        if ("celular".equals(sound)) {
            stopPhoneRingtone();
            ringtone = SoundSynth.phoneRingtone(this);
            if (ringtone != null) {
                try {
                    ringtone.play();
                } catch (Exception ignored) {
                }
            }
            soundMs = 5000;
            handler.postDelayed(() -> {
                if (id == cycleId) stopPhoneRingtone();
            }, soundMs);
        } else {
            short[] pcm = SoundSynth.render(sound);
            if (pcm != null) {
                SoundSynth.release(track);
                track = SoundSynth.play(pcm);
                soundMs = SoundSynth.durationMs(pcm);
            } else {
                for (int i = 0; i < BEEPS_PER_CYCLE; i++) {
                    handler.postDelayed(() -> {
                        if (id == cycleId) beep();
                    }, i * BEEP_INTERVAL_MS);
                }
                soundMs = BEEPS_PER_CYCLE * BEEP_INTERVAL_MS;
            }
        }
        handler.postDelayed(() -> speak(id), soundMs + 300);
    }

    private void stopPhoneRingtone() {
        try {
            if (ringtone != null && ringtone.isPlaying()) ringtone.stop();
        } catch (Exception ignored) {
        }
        ringtone = null;
    }

    private void beep() {
        try {
            if (tone == null) tone = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
            tone.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400);
        } catch (Exception ignored) {
        }
    }

    private void vibrate() {
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null) return;
            if (Build.VERSION.SDK_INT >= 26) {
                v.vibrate(VibrationEffect.createWaveform(new long[]{0, 500, 250, 500, 250, 500}, -1));
            } else {
                v.vibrate(new long[]{0, 500, 250, 500, 250, 500}, -1);
            }
        } catch (Exception ignored) {
        }
    }

    private void speak(final int id) {
        if (id != cycleId || current == null) return;
        String text = current.optString("spoken", current.optString("title"));
        if (!ttsReady || text.isEmpty()) {
            handler.postDelayed(() -> runCycle(id), 2500);
            return;
        }
        // Voice, speed and pitch chosen in Configurações (empty voice = phone default)
        VoiceTools.apply(tts, current.optString("voice", ""),
                (float) current.optDouble("rate", 0.95), (float) current.optDouble("pitch", 1.0));
        final String utteranceId = "alarm-" + id + "-" + System.currentTimeMillis();
        tts.setOnUtteranceProgressListener(new UtteranceProgressListener() {
            @Override
            public void onStart(String s) {
            }

            @Override
            public void onDone(String s) {
                if (utteranceId.equals(s)) handler.postDelayed(() -> runCycle(id), 1500);
            }

            @Override
            public void onError(String s) {
                if (utteranceId.equals(s)) handler.postDelayed(() -> runCycle(id), 1500);
            }
        });
        Bundle params = new Bundle();
        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
    }

    private void stopRinging() {
        cycleId++;
        handler.removeCallbacksAndMessages(null);
        try {
            if (tts != null) tts.stop();
        } catch (Exception ignored) {
        }
        try {
            if (tone != null) tone.stopTone();
        } catch (Exception ignored) {
        }
        SoundSynth.release(track);
        track = null;
        stopPhoneRingtone();
        try {
            Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
            if (v != null) v.cancel();
        } catch (Exception ignored) {
        }
        try {
            if (wakeLock != null && wakeLock.isHeld()) wakeLock.release();
        } catch (Exception ignored) {
        }
    }

    private void stopForegroundCompat() {
        if (Build.VERSION.SDK_INT >= 24) stopForeground(STOP_FOREGROUND_REMOVE);
        else stopForeground(true);
    }

    @Override
    public void onDestroy() {
        stopRinging();
        current = null;
        try {
            if (tts != null) tts.shutdown();
        } catch (Exception ignored) {
        }
        try {
            if (tone != null) tone.release();
        } catch (Exception ignored) {
        }
        super.onDestroy();
    }
}
