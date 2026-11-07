package br.com.rotinaai.app.alarm;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;

/**
 * Keeps the alarm list sent by the app (next days), snoozed alarms, alarms already shown
 * and the user's answers (done / snooze) until the app reads them.
 * Only the next alarm is registered in AlarmManager; after it rings, the following one is set.
 */
public class AlarmStore {
    private static final String PREFS = "rotina_alarms";
    private static final String KEY_SCHEDULE = "schedule";
    private static final String KEY_SNOOZES = "snoozes";
    private static final String KEY_FIRED = "fired";
    private static final String KEY_ACTIONS = "pending_actions";
    private static final long FIRED_TTL_MS = 3L * 24 * 60 * 60 * 1000;
    private static final int ALARM_REQUEST_CODE = 4100;

    private static SharedPreferences prefs(Context c) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private static JSONArray readArray(Context c, String key) {
        try {
            return new JSONArray(prefs(c).getString(key, "[]"));
        } catch (JSONException e) {
            return new JSONArray();
        }
    }

    private static JSONObject readObject(Context c, String key) {
        try {
            return new JSONObject(prefs(c).getString(key, "{}"));
        } catch (JSONException e) {
            return new JSONObject();
        }
    }

    public static synchronized void saveSchedule(Context c, JSONArray alarms) {
        prefs(c).edit().putString(KEY_SCHEDULE, alarms.toString()).apply();
    }

    /** Marks an alarm (by key) as already shown so it does not ring twice. */
    public static synchronized void markFired(Context c, String key) {
        JSONObject fired = readObject(c, KEY_FIRED);
        long now = System.currentTimeMillis();
        try {
            fired.put(key, now);
            // forget very old entries
            JSONArray names = fired.names();
            if (names != null) {
                for (int i = 0; i < names.length(); i++) {
                    String k = names.getString(i);
                    if (now - fired.optLong(k, now) > FIRED_TTL_MS) fired.remove(k);
                }
            }
        } catch (JSONException ignored) {
        }
        prefs(c).edit().putString(KEY_FIRED, fired.toString()).apply();
    }

    /** Snooze: the same alarm rings again at {@code at}. */
    public static synchronized void addSnooze(Context c, JSONObject alarm, long at) {
        JSONArray snoozes = readArray(c, KEY_SNOOZES);
        JSONArray kept = new JSONArray();
        String key = alarm.optString("key");
        for (int i = 0; i < snoozes.length(); i++) {
            JSONObject s = snoozes.optJSONObject(i);
            if (s != null && !key.equals(s.optString("key"))) kept.put(s);
        }
        try {
            JSONObject copy = new JSONObject(alarm.toString());
            copy.put("at", at);
            copy.put("snoozed", true);
            kept.put(copy);
        } catch (JSONException ignored) {
        }
        prefs(c).edit().putString(KEY_SNOOZES, kept.toString()).apply();
    }

    public static synchronized void removeSnooze(Context c, String key) {
        JSONArray snoozes = readArray(c, KEY_SNOOZES);
        JSONArray kept = new JSONArray();
        for (int i = 0; i < snoozes.length(); i++) {
            JSONObject s = snoozes.optJSONObject(i);
            if (s != null && !key.equals(s.optString("key"))) kept.put(s);
        }
        prefs(c).edit().putString(KEY_SNOOZES, kept.toString()).apply();
    }

    public static synchronized void addPendingAction(Context c, JSONObject action) {
        JSONArray actions = readArray(c, KEY_ACTIONS);
        actions.put(action);
        prefs(c).edit().putString(KEY_ACTIONS, actions.toString()).apply();
    }

    public static synchronized JSONArray takePendingActions(Context c) {
        JSONArray actions = readArray(c, KEY_ACTIONS);
        prefs(c).edit().putString(KEY_ACTIONS, "[]").apply();
        return actions;
    }

    /** Next alarm to ring: earliest snooze, or earliest scheduled alarm not shown yet. */
    public static synchronized JSONObject findNext(Context c) {
        long now = System.currentTimeMillis();
        JSONObject fired = readObject(c, KEY_FIRED);
        JSONObject best = null;

        JSONArray snoozes = readArray(c, KEY_SNOOZES);
        for (int i = 0; i < snoozes.length(); i++) {
            JSONObject s = snoozes.optJSONObject(i);
            if (s == null) continue;
            if (best == null || s.optLong("at") < best.optLong("at")) best = s;
        }

        JSONArray schedule = readArray(c, KEY_SCHEDULE);
        for (int i = 0; i < schedule.length(); i++) {
            JSONObject a = schedule.optJSONObject(i);
            if (a == null) continue;
            long at = a.optLong("at");
            // ignore alarms that already rang or are more than 10 minutes late
            if (fired.has(a.optString("key")) || at < now - 10 * 60 * 1000) continue;
            if (best == null || at < best.optLong("at")) best = a;
        }
        return best;
    }

    /** Registers the next alarm in the system (exact, works in Doze / screen off). */
    public static synchronized void scheduleNext(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Intent intent = new Intent(c, AlarmReceiver.class);
        intent.setAction(AlarmReceiver.ACTION_FIRE);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT | (Build.VERSION.SDK_INT >= 23 ? PendingIntent.FLAG_IMMUTABLE : 0);

        JSONObject next = findNext(c);
        if (next == null) {
            PendingIntent existing = PendingIntent.getBroadcast(c, ALARM_REQUEST_CODE, intent, flags);
            am.cancel(existing);
            return;
        }
        long at = Math.max(next.optLong("at"), System.currentTimeMillis() + 1000);
        intent.putExtra(AlarmReceiver.EXTRA_ALARM, next.toString());
        PendingIntent pi = PendingIntent.getBroadcast(c, ALARM_REQUEST_CODE, intent, flags);

        // Tapping the clock icon on the status bar opens the app
        Intent show = c.getPackageManager().getLaunchIntentForPackage(c.getPackageName());
        PendingIntent showPi = PendingIntent.getActivity(c, ALARM_REQUEST_CODE + 1,
                show != null ? show : new Intent(), flags);

        try {
            if (Build.VERSION.SDK_INT >= 31 && !am.canScheduleExactAlarms()) {
                // no exact-alarm permission: best effort
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
            } else {
                am.setAlarmClock(new AlarmManager.AlarmClockInfo(at, showPi), pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pi);
        }
    }
}
