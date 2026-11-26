package br.com.rotinaai.app.alarm;

import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

/** Buttons of the alarm notification ("Já fiz" / "Adiar 10 min"). */
public class ActionReceiver extends BroadcastReceiver {
    public static final String ACTION_DONE = "br.com.rotinaai.app.ALARM_DONE";
    public static final String ACTION_SNOOZE = "br.com.rotinaai.app.ALARM_SNOOZE";
    /** "Não fiz": records that it was not done (it is never marked as done). */
    public static final String ACTION_NOT_DONE = "br.com.rotinaai.app.ALARM_NOT_DONE";
    public static final String ACTION_UNMUTE = "br.com.rotinaai.app.ALARM_UNMUTE";
    /** Lock-screen "Silenciar": stops this alert; it stays pending in the notification bar. */
    public static final String ACTION_SILENCE = "br.com.rotinaai.app.ALARM_SILENCE";
    private static final String EXTRA_MINUTES = "minutes";

    public static PendingIntent pending(Context c, JSONObject alarm, String action, int minutes, int requestCode) {
        Intent i = new Intent(c, ActionReceiver.class);
        i.setAction(action);
        i.putExtra(AlarmReceiver.EXTRA_ALARM, alarm.toString());
        i.putExtra(EXTRA_MINUTES, minutes);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);
        return PendingIntent.getBroadcast(c, requestCode, i, flags);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        if (ACTION_UNMUTE.equals(intent.getAction())) {
            MuteManager.setMute(context, 0); // "Reativar som"
            return;
        }
        if (ACTION_SILENCE.equals(intent.getAction())) {
            if (AlarmService.current != null) {
                try {
                    Intent i = new Intent(context, AlarmService.class);
                    i.setAction(AlarmService.ACTION_SILENCE_CURRENT);
                    context.startService(i);
                } catch (Exception ignored) {
                }
            }
            return;
        }
        try {
            JSONObject alarm = new JSONObject(intent.getStringExtra(AlarmReceiver.EXTRA_ALARM));
            if (ACTION_SNOOZE.equals(intent.getAction())) {
                AlarmActions.handle(context, alarm, AlarmActions.SNOOZE, intent.getIntExtra(EXTRA_MINUTES, 10));
            } else if (ACTION_NOT_DONE.equals(intent.getAction())) {
                AlarmActions.handle(context, alarm, AlarmActions.NOT_DONE, 0);
            } else {
                AlarmActions.handle(context, alarm, AlarmActions.DONE, 0);
            }
        } catch (Exception ignored) {
        }
    }
}
