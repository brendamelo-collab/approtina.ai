package br.com.rotinaai.app.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.hardware.camera2.CameraManager;
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
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Locale;

/**
 * Rings like an alarm clock: repeated beeps + the reminder spoken out loud, in a loop,
 * until the user answers ("Já fiz" or "Adiar"). Shows a full-screen alarm over the lock
 * screen / other apps. After 10 minutes without an answer it snoozes itself for 10 minutes.
 */
public class AlarmService extends Service {
    public static final String ACTION_START = "br.com.rotinaai.app.ALARM_START";
    public static final String ACTION_ANSWERED = "br.com.rotinaai.app.ALARM_ANSWERED";
    /** "Silenciar": stop ringing; current and queued alarms become quiet notifications. */
    public static final String ACTION_MUTE = "br.com.rotinaai.app.ALARM_MUTE";
    /** "Só este aviso": stop the sound of the current alarm only. */
    public static final String ACTION_SILENCE_CURRENT = "br.com.rotinaai.app.ALARM_SILENCE_CURRENT";
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
    /** Cameras in use right now (filled by the availability callback). */
    private final Set<String> camerasInUse = new HashSet<>();
    private CameraManager.AvailabilityCallback cameraCallback;

    // ---- Settings sent by the app with each alarm (Configurações > Sons e voz)
    /** 'ambos' (som + voz), 'alarme' (só som) or 'voz' (só voz). */
    private static String modeOf(JSONObject a) {
        String m = a.optString("mode", "");
        if ("alarme".equals(m) || "voz".equals(m)) return m;
        return "ambos";
    }

    /** How long it rings: 0 = original (10 min, then snoozes itself), -1 = until answered, -2 = one round, >0 = seconds. */
    private static long durationMsOf(JSONObject a) {
        int d = a.optInt("durationSec", 0);
        if (d == 0) return MAX_RING_MS;
        if (d < 0) return d;
        return d * 1000L;
    }

    private static int voiceRepeatsOf(JSONObject a) {
        return Math.max(1, Math.min(10, a.optInt("voiceRepeats", 1)));
    }

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public void onCreate() {
        super.onCreate();
        createChannel(this);
        watchCameras();
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
            if (current == null && !queue.isEmpty() && AlarmStore.isMuted(this)) {
                // silenced in the meantime: must still enter foreground before stopping
                startInForeground(queue.get(0));
                for (JSONObject a : queue) MuteManager.showQuietReminder(this, a);
                queue.clear();
                stopForegroundCompat();
                stopSelf();
            } else if (current == null && !queue.isEmpty()) {
                ringNext();
            } else if (current != null) {
                // keep foreground notification of the current alarm
                startInForeground(current);
            } else {
                stopSelf();
            }
        } else if (ACTION_MUTE.equals(action) || ACTION_SILENCE_CURRENT.equals(action)) {
            boolean all = ACTION_MUTE.equals(action);
            if (current != null) {
                stopRinging();
                MuteManager.showQuietReminder(this, current);
                current = null;
            }
            if (all) {
                for (JSONObject a : queue) MuteManager.showQuietReminder(this, a);
                queue.clear();
            }
            AlarmActivity.closeIfOpen(this);
            if (!queue.isEmpty()) ringNext();
            else {
                stopForegroundCompat();
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
        startInForeground(current, false);
        // Waits a moment so the camera check has answered, then decides how to warn
        final JSONObject alarm = current;
        handler.postDelayed(() -> {
            if (current == alarm) startAlert();
        }, 400);
    }

    private void startAlert() {
        if (isPhoneBusy()) {
            // On a call, with the camera open or recording: only a discreet banner, no alarm screen,
            // no sound and no voice. The reminder stays in the notification bar with its buttons.
            MuteManager.showDiscreetReminder(this, current);
            current = null;
            if (!queue.isEmpty()) ringNext();
            else {
                stopForegroundCompat();
                stopSelf();
            }
            return;
        }
        startInForeground(current, true);
        openFullScreen(current);
        acquireWakeLock();
        ringStartedAt = System.currentTimeMillis();
        cycleId++;
        runCycle(cycleId);
    }

    private void startInForeground(JSONObject alarm) {
        startInForeground(alarm, true);
    }

    private void startInForeground(JSONObject alarm, boolean fullScreen) {
        Notification n = buildNotification(alarm, fullScreen);
        if (Build.VERSION.SDK_INT >= 29) {
            startForeground(NOTIFICATION_ID, n, ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK);
        } else {
            startForeground(NOTIFICATION_ID, n);
        }
    }

    private Notification buildNotification(JSONObject alarm, boolean fullScreen) {
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
                .addAction(0, "✔ Já fiz", ActionReceiver.pending(this, alarm, ActionReceiver.ACTION_DONE, 0, 10))
                .addAction(0, "✕ Não fiz", ActionReceiver.pending(this, alarm, ActionReceiver.ACTION_NOT_DONE, 0, 13))
                .addAction(0, "🔕 Silenciar", silencePending());
        if (fullScreen) b.setFullScreenIntent(fullPi, true);
        else b.setSilent(true).setPriority(NotificationCompat.PRIORITY_LOW);
        return b.build();
    }

    /** Lock-screen button: stops this alert without changing the task (it stays pending). */
    private PendingIntent silencePending() {
        Intent i = new Intent(this, ActionReceiver.class);
        i.setAction(ActionReceiver.ACTION_SILENCE);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(this, 12, i, flags);
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
                long limit = current != null ? durationMsOf(current) : MAX_RING_MS;
                wakeLock.acquire(limit > 0 ? limit + 60 * 1000 : 3 * 60 * 60 * 1000L);
            }
        } catch (Exception ignored) {
        }
    }

    /** One cycle = a burst of beeps + vibration, then the spoken reminder; repeats. */
    private void runCycle(final int id) {
        if (id != cycleId || current == null) return;
        long limit = durationMsOf(current);
        if (limit > 0 && System.currentTimeMillis() - ringStartedAt > limit) {
            if (current.optInt("durationSec", 0) != 0) {
                timeUp(); // chosen duration: stop and leave it pending in the notification bar
                return;
            }
            // No answer (original behaviour): snooze automatically so it keeps insisting later
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
        // Sound chosen in Configurações (padrao = original beeps; nenhum = straight to the voice)
        String mode = modeOf(current);
        String sound = current.optString("sound", "padrao");
        int repeats = Math.max(0, Math.min(20, current.optInt("repeats", 0))); // 0 = original amount
        long soundMs;
        if ("voz".equals(mode) || "nenhum".equals(sound)) {
            soundMs = 0;
        } else if ("celular".equals(sound)) {
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
                final long one = SoundSynth.durationMs(pcm) + 250;
                int times = Math.max(1, repeats);
                for (int i = 0; i < times; i++) {
                    handler.postDelayed(() -> {
                        if (id != cycleId) return;
                        SoundSynth.release(track);
                        track = SoundSynth.play(pcm);
                    }, i * one);
                }
                soundMs = times * one;
            } else {
                int beeps = repeats > 0 ? repeats : BEEPS_PER_CYCLE;
                for (int i = 0; i < beeps; i++) {
                    handler.postDelayed(() -> {
                        if (id == cycleId) beep();
                    }, i * BEEP_INTERVAL_MS);
                }
                soundMs = beeps * BEEP_INTERVAL_MS;
            }
        }
        if ("alarme".equals(mode)) {
            // Only the alarm: no voice; next round after a short pause
            handler.postDelayed(() -> endOfRound(id), soundMs + 1500);
        } else {
            handler.postDelayed(() -> speak(id, voiceRepeatsOf(current)), soundMs + 300);
        }
    }

    /** One round (sound + voice) finished: ring again, or stop if it was set to ring only once. */
    private void endOfRound(final int id) {
        if (id != cycleId || current == null) return;
        if (durationMsOf(current) == -2) {
            timeUp();
            return;
        }
        runCycle(id);
    }

    /** Chosen time is over: stop sound and voice; the reminder stays pending (never marked as done). */
    private void timeUp() {
        JSONObject alarm = current;
        if (alarm == null) return;
        stopRinging();
        MuteManager.showQuietReminder(this, alarm);
        current = null;
        AlarmActivity.closeIfOpen(this);
        if (!queue.isEmpty()) ringNext();
        else {
            stopForegroundCompat();
            stopSelf();
        }
    }

    // ---- Busy phone: call, video call, camera or recording
    private void watchCameras() {
        if (Build.VERSION.SDK_INT < 21) return;
        try {
            CameraManager cm = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
            if (cm == null) return;
            cameraCallback = new CameraManager.AvailabilityCallback() {
                @Override
                public void onCameraAvailable(String cameraId) {
                    synchronized (camerasInUse) {
                        camerasInUse.remove(cameraId);
                    }
                }

                @Override
                public void onCameraUnavailable(String cameraId) {
                    synchronized (camerasInUse) {
                        camerasInUse.add(cameraId);
                    }
                }
            };
            // The callback reports right away which cameras are already in use
            cm.registerAvailabilityCallback(cameraCallback, handler);
        } catch (Exception ignored) {
        }
    }

    /** True during a phone/video call, while the camera is open or while something is recording. */
    private boolean isPhoneBusy() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                int mode = am.getMode();
                if (mode == AudioManager.MODE_IN_CALL || mode == AudioManager.MODE_IN_COMMUNICATION || mode == AudioManager.MODE_RINGTONE) {
                    return true;
                }
                if (Build.VERSION.SDK_INT >= 33 && mode == AudioManager.MODE_CALL_SCREENING) return true;
                if (Build.VERSION.SDK_INT >= 24) {
                    // Someone recording (voice memo, video): ignores the assistant's "Ok Google" listening
                    for (android.media.AudioRecordingConfiguration rc : am.getActiveRecordingConfigurations()) {
                        int src = rc.getClientAudioSource();
                        if (src == android.media.MediaRecorder.AudioSource.MIC || src == android.media.MediaRecorder.AudioSource.CAMCORDER
                                || src == android.media.MediaRecorder.AudioSource.VOICE_COMMUNICATION || src == android.media.MediaRecorder.AudioSource.DEFAULT
                                || src == android.media.MediaRecorder.AudioSource.UNPROCESSED) {
                            return true;
                        }
                    }
                }
            }
        } catch (Exception ignored) {
        }
        synchronized (camerasInUse) {
            return !camerasInUse.isEmpty();
        }
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

    private void speak(final int id, final int timesLeft) {
        if (id != cycleId || current == null) return;
        String text = current.optString("spoken", current.optString("title"));
        if (!ttsReady || text.isEmpty()) {
            handler.postDelayed(() -> endOfRound(id), 2500);
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
                if (!utteranceId.equals(s)) return;
                // Says it again (as many times as chosen), then the round ends
                if (timesLeft > 1) handler.postDelayed(() -> speak(id, timesLeft - 1), 700);
                else handler.postDelayed(() -> endOfRound(id), 1500);
            }

            @Override
            public void onError(String s) {
                if (utteranceId.equals(s)) handler.postDelayed(() -> endOfRound(id), 1500);
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
        try {
            if (cameraCallback != null && Build.VERSION.SDK_INT >= 21) {
                CameraManager cm = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
                if (cm != null) cm.unregisterAvailabilityCallback(cameraCallback);
            }
        } catch (Exception ignored) {
        }
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
