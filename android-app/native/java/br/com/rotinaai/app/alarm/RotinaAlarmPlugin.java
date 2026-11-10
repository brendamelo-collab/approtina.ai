package br.com.rotinaai.app.alarm;

import android.Manifest;
import android.app.AlarmManager;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.media.AudioTrack;
import android.media.Ringtone;
import android.media.ToneGenerator;
import android.media.AudioManager;
import android.os.Handler;
import android.os.Looper;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;

import androidx.core.app.ActivityCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONArray;
import org.json.JSONObject;

import java.lang.ref.WeakReference;

/** Bridge used by the web app (window.Capacitor) to schedule native alarms. */
@CapacitorPlugin(name = "RotinaAlarm")
public class RotinaAlarmPlugin extends Plugin {
    private static WeakReference<RotinaAlarmPlugin> instance = new WeakReference<>(null);

    @Override
    public void load() {
        instance = new WeakReference<>(this);
        AlarmService.createChannel(getContext());
    }

    /** Called when the user answers an alarm while the app is running. */
    static void emitAction(JSONObject record) {
        RotinaAlarmPlugin p = instance.get();
        if (p == null) return;
        try {
            p.notifyListeners("alarmAction", JSObject.fromJSONObject(record));
        } catch (Exception ignored) {
        }
    }

    /** Replaces the list of upcoming alarms: [{key,id,type,title,heading,spoken,subtitle,timeLabel,at}] */
    @PluginMethod
    public void setAlarms(PluginCall call) {
        JSArray alarms = call.getArray("alarms", new JSArray());
        try {
            AlarmStore.saveSchedule(getContext(), new JSONArray(alarms.toString()));
        } catch (Exception e) {
            call.reject("Lista de alarmes inválida");
            return;
        }
        AlarmStore.scheduleNext(getContext());
        call.resolve();
    }

    /** Answers given on the alarm screen while the app was closed. */
    @PluginMethod
    public void takePendingActions(PluginCall call) {
        JSONArray actions = AlarmStore.takePendingActions(getContext());
        JSObject ret = new JSObject();
        try {
            ret.put("actions", new JSArray(actions.toString()));
        } catch (Exception e) {
            ret.put("actions", new JSArray());
        }
        call.resolve(ret);
    }

    /** Which permissions the alarm still needs. */
    @PluginMethod
    public void getStatus(PluginCall call) {
        Context c = getContext();
        JSObject ret = new JSObject();
        ret.put("notifications", NotificationManagerCompat.from(c).areNotificationsEnabled());
        boolean exact = true;
        if (Build.VERSION.SDK_INT >= 31) {
            AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
            exact = am != null && am.canScheduleExactAlarms();
        }
        ret.put("exactAlarm", exact);
        boolean fullScreen = true;
        if (Build.VERSION.SDK_INT >= 34) {
            NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreen = nm != null && nm.canUseFullScreenIntent();
        }
        ret.put("fullScreen", fullScreen);
        ret.put("overlay", Build.VERSION.SDK_INT < 23 || Settings.canDrawOverlays(c));
        boolean battery = true;
        if (Build.VERSION.SDK_INT >= 23) {
            PowerManager pm = (PowerManager) c.getSystemService(Context.POWER_SERVICE);
            battery = pm != null && pm.isIgnoringBatteryOptimizations(c.getPackageName());
        }
        ret.put("battery", battery);
        call.resolve(ret);
    }

    /** Opens the system screen for one permission: notifications | exactAlarm | fullScreen | overlay | battery */
    @PluginMethod
    public void openSetting(PluginCall call) {
        String which = call.getString("which", "");
        Context c = getContext();
        Uri pkg = Uri.parse("package:" + c.getPackageName());
        Intent i;
        switch (which) {
            case "notifications":
                if (Build.VERSION.SDK_INT >= 33
                        && ContextCompat.checkSelfPermission(c, Manifest.permission.POST_NOTIFICATIONS) != PackageManager.PERMISSION_GRANTED
                        && getActivity() != null) {
                    ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.POST_NOTIFICATIONS}, 7001);
                    call.resolve();
                    return;
                }
                i = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
                i.putExtra(Settings.EXTRA_APP_PACKAGE, c.getPackageName());
                break;
            case "exactAlarm":
                i = Build.VERSION.SDK_INT >= 31
                        ? new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM, pkg)
                        : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
                break;
            case "fullScreen":
                i = Build.VERSION.SDK_INT >= 34
                        ? new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT, pkg)
                        : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
                break;
            case "overlay":
                i = Build.VERSION.SDK_INT >= 23
                        ? new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION, pkg)
                        : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
                break;
            case "battery":
                i = Build.VERSION.SDK_INT >= 23
                        ? new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS, pkg)
                        : new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
                break;
            default:
                i = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
        }
        try {
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(i);
        } catch (Exception e) {
            Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS, pkg);
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            c.startActivity(fallback);
        }
        call.resolve();
    }

    /** Test: rings a sample alarm in N seconds. */
    @PluginMethod
    public void testAlarm(PluginCall call) {
        int seconds = call.getInt("seconds", 10);
        try {
            JSONObject a = new JSONObject();
            a.put("key", "teste@" + System.currentTimeMillis());
            a.put("id", "teste");
            a.put("type", "rotina");
            a.put("heading", "Teste de alarme");
            a.put("title", call.getString("title", "Alarme de teste"));
            a.put("spoken", call.getString("spoken", "Este é um teste do alarme do Rotina ponto A I."));
            a.put("sound", call.getString("sound", "padrao"));
            a.put("voice", call.getString("voice", ""));
            a.put("rate", (double) call.getFloat("rate", 0.95f));
            a.put("pitch", (double) call.getFloat("pitch", 1.0f));
            java.text.SimpleDateFormat fmt = new java.text.SimpleDateFormat("HH:mm", java.util.Locale.getDefault());
            long at = System.currentTimeMillis() + seconds * 1000L;
            a.put("timeLabel", fmt.format(new java.util.Date(at)));
            AlarmStore.addSnooze(getContext(), a, at);
            AlarmStore.scheduleNext(getContext());
        } catch (Exception ignored) {
        }
        call.resolve();
    }

    private static final Handler main = new Handler(Looper.getMainLooper());
    private static AudioTrack previewTrack;
    private static Ringtone previewRingtone;

    /** Portuguese voices of this phone: [{name, locale, network, quality}] */
    @PluginMethod
    public void getVoices(PluginCall call) {
        VoiceTools.withPreviewTts(getContext(), () -> {
            JSArray list = new JSArray();
            TextToSpeech t = VoiceTools.previewTts();
            for (Voice v : VoiceTools.portugueseVoices(t)) {
                try {
                    JSObject o = new JSObject();
                    o.put("name", v.getName());
                    o.put("locale", v.getLocale().toLanguageTag());
                    o.put("network", v.isNetworkConnectionRequired());
                    o.put("quality", v.getQuality());
                    list.put(o);
                } catch (Exception ignored) {
                }
            }
            JSObject ret = new JSObject();
            ret.put("voices", list);
            ret.put("available", t != null);
            call.resolve(ret);
        });
    }

    /** Speaks a sample with the chosen voice, speed and pitch. */
    @PluginMethod
    public void previewVoice(PluginCall call) {
        final String text = call.getString("text", "Olá! Esta é a voz dos seus lembretes do Rotina ponto A I.");
        final String voice = call.getString("voice", "");
        final float rate = call.getFloat("rate", 0.95f);
        final float pitch = call.getFloat("pitch", 1.0f);
        VoiceTools.withPreviewTts(getContext(), () -> {
            TextToSpeech t = VoiceTools.previewTts();
            if (t == null) {
                call.reject("Voz indisponível neste aparelho");
                return;
            }
            VoiceTools.apply(t, voice, rate, pitch);
            VoiceTools.speakOnAlarmVolume(t, text, "preview-" + System.currentTimeMillis());
            call.resolve();
        });
    }

    /** Plays one cycle of an alarm sound. */
    @PluginMethod
    public void previewSound(PluginCall call) {
        final String sound = call.getString("sound", "padrao");
        main.post(() -> {
            stopPreview();
            if ("celular".equals(sound)) {
                previewRingtone = SoundSynth.phoneRingtone(getContext());
                if (previewRingtone != null) {
                    try {
                        previewRingtone.play();
                    } catch (Exception ignored) {
                    }
                    main.postDelayed(RotinaAlarmPlugin::stopPreview, 4000);
                }
            } else {
                short[] pcm = SoundSynth.render(sound);
                if (pcm != null) {
                    previewTrack = SoundSynth.play(pcm);
                    main.postDelayed(RotinaAlarmPlugin::stopPreview, SoundSynth.durationMs(pcm) + 200);
                } else {
                    try {
                        final ToneGenerator tg = new ToneGenerator(AudioManager.STREAM_ALARM, 100);
                        for (int i = 0; i < 3; i++) {
                            main.postDelayed(() -> tg.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 400), i * 650L);
                        }
                        main.postDelayed(tg::release, 2400);
                    } catch (Exception ignored) {
                    }
                }
            }
            call.resolve();
        });
    }

    private static void stopPreview() {
        SoundSynth.release(previewTrack);
        previewTrack = null;
        try {
            if (previewRingtone != null && previewRingtone.isPlaying()) previewRingtone.stop();
        } catch (Exception ignored) {
        }
        previewRingtone = null;
    }
}
