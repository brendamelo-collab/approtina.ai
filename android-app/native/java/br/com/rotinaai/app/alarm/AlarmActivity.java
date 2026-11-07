package br.com.rotinaai.app.alarm;

import android.app.Activity;
import android.app.KeyguardManager;
import android.content.Context;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.os.Build;
import android.os.Bundle;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;

/** Full-screen alarm (over the lock screen and other apps), like an alarm clock. */
public class AlarmActivity extends Activity {
    private static WeakReference<AlarmActivity> instance = new WeakReference<>(null);
    private JSONObject alarm;

    public static void closeIfOpen(Context c) {
        AlarmActivity a = instance.get();
        if (a != null) a.runOnUiThread(a::finish);
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        instance = new WeakReference<>(this);
        showOverLockScreen();
        alarm = AlarmService.current;
        if (alarm == null) {
            finish();
            return;
        }
        setContentView(buildLayout(alarm));
    }

    @Override
    protected void onResume() {
        super.onResume();
        // Alarm answered somewhere else (notification button): close
        if (AlarmService.current == null) finish();
    }

    @Override
    protected void onDestroy() {
        if (instance.get() == this) instance = new WeakReference<>(null);
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // Must answer "Já fiz" or "Adiar"
    }

    private void showOverLockScreen() {
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
            KeyguardManager km = (KeyguardManager) getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null) km.requestDismissKeyguard(this, null);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
                    | WindowManager.LayoutParams.FLAG_DISMISS_KEYGUARD);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private int dp(int v) {
        return (int) TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics());
    }

    private TextView text(String s, int sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        if (bold) t.setTypeface(Typeface.DEFAULT_BOLD);
        return t;
    }

    private Button button(String label, int bg, int fg, View.OnClickListener onClick) {
        Button b = new Button(this);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 18);
        b.setTypeface(Typeface.DEFAULT_BOLD);
        b.setTextColor(fg);
        GradientDrawable shape = new GradientDrawable();
        shape.setColor(bg);
        shape.setCornerRadius(dp(22));
        b.setBackground(shape);
        b.setPadding(dp(16), dp(16), dp(16), dp(16));
        b.setOnClickListener(onClick);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(10);
        b.setLayoutParams(lp);
        return b;
    }

    private View buildLayout(JSONObject a) {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(28), dp(48), dp(28), dp(36));
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[]{Color.parseColor("#A69280"), Color.parseColor("#5E4D40")});
        root.setBackground(bg);

        String type = a.optString("type");
        String emoji = "medicamento".equals(type) ? "💊" : "agenda".equals(type) ? "📅" : "⏰";

        root.addView(text(emoji, 64, Color.WHITE, false));
        TextView heading = text(a.optString("heading", "Lembrete"), 18, Color.parseColor("#F7EEE3"), true);
        heading.setPadding(0, dp(12), 0, 0);
        root.addView(heading);
        TextView time = text(a.optString("timeLabel", ""), 56, Color.WHITE, true);
        root.addView(time);
        TextView title = text(a.optString("title", ""), 26, Color.WHITE, true);
        title.setPadding(0, dp(4), 0, 0);
        root.addView(title);
        String subtitle = a.optString("subtitle", "");
        if (!subtitle.isEmpty()) {
            TextView sub = text(subtitle, 16, Color.parseColor("#F7EEE3"), false);
            sub.setPadding(0, dp(6), 0, 0);
            root.addView(sub);
        }

        View spacer = new View(this);
        root.addView(spacer, new LinearLayout.LayoutParams(1, dp(36)));

        String doneLabel = "medicamento".equals(type) ? "✔  Já tomei / Concluído" : "✔  Já fiz / Concluído";
        root.addView(button(doneLabel, Color.parseColor("#7D9D7F"), Color.WHITE,
                v -> AlarmActions.handle(this, alarm, AlarmActions.DONE, 0)));

        TextView snoozeLabel = text("Adiar", 15, Color.parseColor("#F7EEE3"), true);
        snoozeLabel.setPadding(0, dp(18), 0, 0);
        root.addView(snoozeLabel);

        LinearLayout row = new LinearLayout(this);
        row.setOrientation(LinearLayout.HORIZONTAL);
        int[] options = {5, 10, 15, 30, 60};
        for (int m : options) {
            Button b = button(m == 60 ? "1 h" : m + " min", Color.parseColor("#F7EEE3"), Color.parseColor("#5C4F44"),
                    v -> AlarmActions.handle(this, alarm, AlarmActions.SNOOZE, m));
            b.setTextSize(TypedValue.COMPLEX_UNIT_SP, 14);
            b.setPadding(dp(4), dp(14), dp(4), dp(14));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f);
            lp.setMargins(dp(3), dp(6), dp(3), 0);
            b.setLayoutParams(lp);
            row.addView(b);
        }
        root.addView(row);
        return root;
    }
}
