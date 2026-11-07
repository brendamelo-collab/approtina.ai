package br.com.rotinaai.app.alarm;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.os.Build;

import org.json.JSONObject;

/** Called by AlarmManager at the alarm time; also reschedules after reboot / app update. */
public class AlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_FIRE = "br.com.rotinaai.app.ALARM_FIRE";
    public static final String EXTRA_ALARM = "alarm";

    @Override
    public void onReceive(Context context, Intent intent) {
        String action = intent.getAction();
        if (ACTION_FIRE.equals(action)) {
            String json = intent.getStringExtra(EXTRA_ALARM);
            if (json != null) {
                try {
                    JSONObject alarm = new JSONObject(json);
                    String key = alarm.optString("key");
                    if (alarm.optBoolean("snoozed")) AlarmStore.removeSnooze(context, key);
                    AlarmStore.markFired(context, key);

                    Intent svc = new Intent(context, AlarmService.class);
                    svc.setAction(AlarmService.ACTION_START);
                    svc.putExtra(EXTRA_ALARM, alarm.toString());
                    if (Build.VERSION.SDK_INT >= 26) context.startForegroundService(svc);
                    else context.startService(svc);
                } catch (Exception ignored) {
                }
            }
        }
        // Boot, app update, time change, permission granted or alarm fired: set the next alarm
        AlarmStore.scheduleNext(context);
    }
}
