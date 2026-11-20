package br.com.rotinaai.app.alarm;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;

import org.json.JSONObject;

import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Locale;

/**
 * "Silenciar alarmes": while silenced, reminders still appear as a quiet notification
 * (with "Já fiz" / "Adiar"), without sound, voice, vibration or full screen.
 * A fixed notification shows until when, with a "Reativar som" button.
 */
public class MuteManager {
    public static final long MUTE_FOREVER = 4102444800000L; // 01/01/2100 = "até eu reativar" (same value as the web app)
    public static final String CHANNEL_QUIET = "rotina_lembretes_silenciosos_v1";
    private static final int STATUS_ID = 4300;

    private static NotificationManager nm(Context c) {
        return (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
    }

    private static void createChannel(Context c) {
        if (Build.VERSION.SDK_INT < 26) return;
        NotificationManager m = nm(c);
        if (m == null || m.getNotificationChannel(CHANNEL_QUIET) != null) return;
        NotificationChannel ch = new NotificationChannel(CHANNEL_QUIET, "Lembretes silenciados", NotificationManager.IMPORTANCE_DEFAULT);
        ch.setDescription("Lembretes que chegam enquanto os alarmes estão silenciados");
        ch.setSound(null, null);
        ch.enableVibration(false);
        ch.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        m.createNotificationChannel(ch);
    }

    private static int flags() {
        return PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
    }

    private static PendingIntent openApp(Context c, int code) {
        Intent show = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        return PendingIntent.getActivity(c, code, show != null ? show : new Intent(), flags());
    }

    /** Silences (until > now) or reactivates (until = 0) the alarms. */
    public static void setMute(Context c, long until) {
        AlarmStore.setMutedUntil(c, until);
        updateStatus(c);
        if (AlarmStore.isMuted(c) && AlarmService.current != null) {
            // stop what is ringing now; it stays as a quiet notification
            try {
                Intent i = new Intent(c, AlarmService.class);
                i.setAction(AlarmService.ACTION_MUTE);
                c.startService(i);
            } catch (Exception ignored) {
            }
            AlarmActivity.closeIfOpen(c);
        }
    }

    public static String untilLabel(long until) {
        if (until >= MUTE_FOREVER) return "até você reativar";
        Calendar now = Calendar.getInstance();
        Calendar at = Calendar.getInstance();
        at.setTimeInMillis(until);
        String hhmm = new SimpleDateFormat("HH:mm", new Locale("pt", "BR")).format(at.getTime());
        if (now.get(Calendar.DAY_OF_YEAR) == at.get(Calendar.DAY_OF_YEAR) && now.get(Calendar.YEAR) == at.get(Calendar.YEAR)) return "até " + hhmm;
        return "até " + new SimpleDateFormat("dd/MM", new Locale("pt", "BR")).format(at.getTime()) + " às " + hhmm;
    }

    /** Fixed notification "Alarmes silenciados até 15:30 · Reativar som". */
    public static void updateStatus(Context c) {
        NotificationManager m = nm(c);
        if (m == null) return;
        long until = AlarmStore.getMutedUntil(c);
        if (until == 0) {
            m.cancel(STATUS_ID);
            return;
        }
        createChannel(c);
        Intent unmute = new Intent(c, ActionReceiver.class);
        unmute.setAction(ActionReceiver.ACTION_UNMUTE);
        PendingIntent unmutePi = PendingIntent.getBroadcast(c, STATUS_ID, unmute, flags());
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL_QUIET)
                .setSmallIcon(android.R.drawable.ic_lock_silent_mode)
                .setContentTitle("Alarmes silenciados " + untilLabel(until))
                .setContentText("Os lembretes aparecem aqui, sem som e sem voz.")
                .setOngoing(true)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setContentIntent(openApp(c, STATUS_ID + 1))
                .addAction(0, "Reativar som", unmutePi);
        if (until < MUTE_FOREVER) b.setTimeoutAfter(Math.max(1000, until - System.currentTimeMillis()));
        m.notify(STATUS_ID, b.build());
    }

    private static int idFor(String key) {
        return 5000 + (key.hashCode() & 0x3fff);
    }

    /** The reminder without sound: shows in the notification bar with "Já fiz" / "Adiar". */
    public static void showQuietReminder(Context c, JSONObject alarm) {
        NotificationManager m = nm(c);
        if (m == null || alarm == null) return;
        createChannel(c);
        int id = idFor(alarm.optString("key"));
        String time = alarm.optString("timeLabel", "");
        String title = alarm.optString("title", "Lembrete");
        boolean med = "medicamento".equals(alarm.optString("type"));
        NotificationCompat.Builder b = new NotificationCompat.Builder(c, CHANNEL_QUIET)
                .setSmallIcon(android.R.drawable.ic_lock_idle_alarm)
                .setContentTitle((time.isEmpty() ? "" : time + " • ") + title)
                .setContentText(alarm.optString("heading", "Lembrete") + " (silenciado)")
                .setSilent(true)
                .setAutoCancel(true)
                .setCategory(NotificationCompat.CATEGORY_REMINDER)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setContentIntent(openApp(c, id))
                .addAction(0, med ? "✔ Já tomei" : "✔ Já fiz", ActionReceiver.pending(c, alarm, ActionReceiver.ACTION_DONE, 0, id * 4))
                .addAction(0, "Adiar 10 min", ActionReceiver.pending(c, alarm, ActionReceiver.ACTION_SNOOZE, 10, id * 4 + 1));
        m.notify(id, b.build());
    }

    public static void cancelQuiet(Context c, String key) {
        NotificationManager m = nm(c);
        if (m != null && key != null) m.cancel(idFor(key));
    }
}
