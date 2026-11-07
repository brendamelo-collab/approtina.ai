package br.com.rotinaai.app.alarm;

import android.content.Context;
import android.content.Intent;

import org.json.JSONObject;

/** What happens when the user answers an alarm ("Já fiz" or "Adiar"). */
public class AlarmActions {
    public static final String DONE = "fez";
    public static final String SNOOZE = "adiar";

    public static void handle(Context c, JSONObject alarm, String action, int snoozeMinutes) {
        if (alarm == null) return;
        String key = alarm.optString("key");
        long now = System.currentTimeMillis();

        if (SNOOZE.equals(action)) {
            AlarmStore.addSnooze(c, alarm, now + snoozeMinutes * 60L * 1000L);
        } else {
            AlarmStore.removeSnooze(c, key);
        }

        // The app reads these answers to mark the item as done / snoozed in your data
        try {
            JSONObject record = new JSONObject();
            record.put("key", key);
            record.put("id", alarm.optString("id"));
            record.put("type", alarm.optString("type"));
            record.put("action", action);
            record.put("minutes", snoozeMinutes);
            record.put("at", now);
            AlarmStore.addPendingAction(c, record);
            RotinaAlarmPlugin.emitAction(record);
        } catch (Exception ignored) {
        }

        // Stop the sound / voice of this alarm
        try {
            Intent stop = new Intent(c, AlarmService.class);
            stop.setAction(AlarmService.ACTION_ANSWERED);
            stop.putExtra(AlarmService.EXTRA_KEY, key);
            c.startService(stop);
        } catch (Exception ignored) {
        }

        AlarmStore.scheduleNext(c);
        AlarmActivity.closeIfOpen(c);
    }
}
