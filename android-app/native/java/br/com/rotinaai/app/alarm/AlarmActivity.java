package br.com.rotinaai.app.alarm;

import android.animation.ValueAnimator;
import android.app.Activity;
import android.content.Context;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;
import android.os.Build;
import android.os.Bundle;
import android.text.TextUtils;
import android.util.TypedValue;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowManager;
import android.view.animation.DecelerateInterpolator;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

import org.json.JSONObject;

import java.lang.ref.WeakReference;
import java.util.ArrayList;
import java.util.List;

/**
 * Full-screen alarm (over the lock screen and other apps), like an alarm clock.
 * Top: time and reminder over the palette colors, with a soft pulse.
 * Bottom card: "Já fiz", "Adiar por" and "Silenciar" (só este aviso / 30 min ... / até reativar).
 */
public class AlarmActivity extends Activity {
    private static WeakReference<AlarmActivity> instance = new WeakReference<>(null);
    private JSONObject alarm;
    private final List<ValueAnimator> animators = new ArrayList<>();

    private static final int CARD = Color.parseColor("#FAF8F5");
    private static final int INK = Color.parseColor("#2C2C2C");
    private static final int INK_SOFT = Color.parseColor("#4A3E34");
    private static final int MUTED = Color.parseColor("#8C7A6B");
    private static final int LINE = Color.parseColor("#E6DDD0");
    private static final int CHIP = Color.parseColor("#FFFFFF");
    private static final int GREEN = Color.parseColor("#4F7A53");

    private int accent = Color.parseColor("#A69280");
    private int accentDark = Color.parseColor("#5E4D40");

    private LinearLayout actionsPanel;
    private LinearLayout mutePanel;

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
        accent = color(alarm.optString("accent"), accent);
        accentDark = color(alarm.optString("accentDark"), accentDark);
        colorSystemBars();
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
        for (ValueAnimator a : animators) a.cancel();
        animators.clear();
        if (instance.get() == this) instance = new WeakReference<>(null);
        super.onDestroy();
    }

    @Override
    public void onBackPressed() {
        // "Voltar" closes the silence options; otherwise the alarm must be answered
        if (mutePanel != null && mutePanel.getVisibility() == View.VISIBLE) showMute(false);
    }

    private void showOverLockScreen() {
        // Shows over the lock screen WITHOUT asking to unlock: all buttons work with the phone locked
        if (Build.VERSION.SDK_INT >= 27) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON);
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
    }

    private void colorSystemBars() {
        if (Build.VERSION.SDK_INT < 21) return;
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(accent);
        getWindow().setNavigationBarColor(CARD);
        if (Build.VERSION.SDK_INT >= 26) {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        }
    }

    // ------------------------------------------------------------------ helpers

    private static int color(String hex, int fallback) {
        try {
            return hex != null && hex.matches("#[0-9a-fA-F]{6}") ? Color.parseColor(hex) : fallback;
        } catch (Exception e) {
            return fallback;
        }
    }

    private static int alpha(int color, float a) {
        return Color.argb(Math.round(a * 255), Color.red(color), Color.green(color), Color.blue(color));
    }

    private int dp(float v) {
        return Math.round(TypedValue.applyDimension(TypedValue.COMPLEX_UNIT_DIP, v, getResources().getDisplayMetrics()));
    }

    private TextView text(String s, float sp, int color, int style) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(TypedValue.COMPLEX_UNIT_SP, sp);
        t.setTextColor(color);
        t.setGravity(Gravity.CENTER);
        t.setTypeface(Typeface.create("sans-serif", style));
        t.setIncludeFontPadding(false);
        return t;
    }

    private GradientDrawable shape(int fill, float radiusDp, int strokeColor) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(fill);
        g.setCornerRadius(dp(radiusDp));
        if (strokeColor != 0) g.setStroke(dp(1), strokeColor);
        return g;
    }

    private Drawable pressable(GradientDrawable base, int rippleColor) {
        if (Build.VERSION.SDK_INT >= 21) return new RippleDrawable(ColorStateList.valueOf(rippleColor), base, null);
        return base;
    }

    /** Big rounded button (TextView, so it has no default Android styling). */
    private TextView button(String label, int bg, int fg, int stroke, float heightDp, float textSp, View.OnClickListener onClick) {
        TextView b = text(label, textSp, fg, Typeface.BOLD);
        b.setBackground(pressable(shape(bg, 18, stroke), alpha(fg, 0.18f)));
        b.setMinHeight(dp(heightDp));
        b.setPadding(dp(10), dp(6), dp(10), dp(6));
        b.setClickable(true);
        b.setFocusable(true);
        b.setMaxLines(2);
        b.setEllipsize(TextUtils.TruncateAt.END);
        b.setOnClickListener(onClick);
        return b;
    }

    private LinearLayout.LayoutParams full(int topMarginDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.topMargin = dp(topMarginDp);
        return lp;
    }

    private LinearLayout.LayoutParams weighted(int leftDp, int rightDp) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.leftMargin = dp(leftDp);
        lp.rightMargin = dp(rightDp);
        return lp;
    }

    private LinearLayout row() {
        LinearLayout r = new LinearLayout(this);
        r.setOrientation(LinearLayout.HORIZONTAL);
        return r;
    }

    private LinearLayout column() {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        return c;
    }

    /** Soft ring that grows and fades, behind the emoji. */
    private View pulseRing(int sizeDp, long delayMs) {
        View ring = new View(this);
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(Color.argb(70, 255, 255, 255));
        ring.setBackground(g);
        FrameLayout.LayoutParams lp = new FrameLayout.LayoutParams(dp(sizeDp), dp(sizeDp), Gravity.CENTER);
        ring.setLayoutParams(lp);
        ValueAnimator va = ValueAnimator.ofFloat(0f, 1f);
        va.setDuration(2200);
        va.setStartDelay(delayMs);
        va.setRepeatCount(ValueAnimator.INFINITE);
        va.setInterpolator(new DecelerateInterpolator());
        va.addUpdateListener(an -> {
            float f = (float) an.getAnimatedValue();
            float scale = 0.72f + 0.55f * f;
            ring.setScaleX(scale);
            ring.setScaleY(scale);
            ring.setAlpha(0.9f * (1f - f));
        });
        va.start();
        animators.add(va);
        return ring;
    }

    // ------------------------------------------------------------------ layout

    private View buildLayout(JSONObject a) {
        String type = a.optString("type");
        boolean med = "medicamento".equals(type);
        String emoji = med ? "💊" : "agenda".equals(type) ? "📅" : "🌿";

        LinearLayout root = column();
        root.setBackground(new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[]{accent, accentDark}));

        // ---- Top: reminder (scrolls on small screens / big fonts)
        ScrollView scroll = new ScrollView(this);
        scroll.setFillViewport(true);
        LinearLayout top = column();
        top.setGravity(Gravity.CENTER);
        top.setPadding(dp(28), dp(36), dp(28), dp(44));
        scroll.addView(top, new ViewGroup.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));
        root.addView(scroll, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        TextView pill = text(a.optString("heading", "Lembrete").toUpperCase(), 11, Color.WHITE, Typeface.BOLD);
        if (Build.VERSION.SDK_INT >= 21) pill.setLetterSpacing(0.16f);
        pill.setBackground(shape(Color.argb(40, 255, 255, 255), 50, 0));
        pill.setPadding(dp(14), dp(6), dp(14), dp(6));
        top.addView(pill, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        FrameLayout pulse = new FrameLayout(this);
        pulse.setClipChildren(false);
        pulse.addView(pulseRing(150, 0));
        pulse.addView(pulseRing(150, 1100));
        TextView badge = text(emoji, 50, INK, Typeface.NORMAL);
        GradientDrawable circle = new GradientDrawable();
        circle.setShape(GradientDrawable.OVAL);
        circle.setColor(alpha(Color.WHITE, 0.96f));
        badge.setBackground(circle);
        if (Build.VERSION.SDK_INT >= 21) badge.setElevation(dp(6));
        pulse.addView(badge, new FrameLayout.LayoutParams(dp(108), dp(108), Gravity.CENTER));
        LinearLayout.LayoutParams pulseLp = new LinearLayout.LayoutParams(dp(170), dp(170));
        pulseLp.topMargin = dp(18);
        top.addView(pulse, pulseLp);

        TextView time = text(a.optString("timeLabel", ""), 64, Color.WHITE, Typeface.NORMAL);
        time.setTypeface(Typeface.create("sans-serif-light", Typeface.NORMAL));
        top.addView(time, full(14));

        TextView title = text(a.optString("title", ""), 26, Color.WHITE, Typeface.BOLD);
        title.setMaxLines(3);
        title.setEllipsize(TextUtils.TruncateAt.END);
        title.setLineSpacing(0, 1.1f);
        top.addView(title, full(12));

        String subtitle = a.optString("subtitle", "");
        if (!subtitle.isEmpty()) {
            TextView sub = text(subtitle, 16, alpha(Color.WHITE, 0.86f), Typeface.NORMAL);
            sub.setMaxLines(3);
            sub.setEllipsize(TextUtils.TruncateAt.END);
            sub.setLineSpacing(0, 1.15f);
            top.addView(sub, full(8));
        }

        // ---- Bottom card: answers
        LinearLayout card = column();
        GradientDrawable cardBg = new GradientDrawable();
        cardBg.setColor(CARD);
        float r = dp(28);
        cardBg.setCornerRadii(new float[]{r, r, r, r, 0, 0, 0, 0});
        card.setBackground(cardBg);
        card.setPadding(dp(20), dp(22), dp(20), dp(20));
        if (Build.VERSION.SDK_INT >= 21) card.setElevation(dp(12));
        root.addView(card, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT));

        actionsPanel = column();
        card.addView(actionsPanel, full(0));

        actionsPanel.addView(button(med ? "✔   Já tomei" : "✔   Já fiz", GREEN, Color.WHITE, 0, 62, 20,
                v -> AlarmActions.handle(this, alarm, AlarmActions.DONE, 0)), full(0));

        TextView snoozeLabel = text("ADIAR POR", 12, MUTED, Typeface.BOLD);
        snoozeLabel.setGravity(Gravity.START);
        if (Build.VERSION.SDK_INT >= 21) snoozeLabel.setLetterSpacing(0.12f);
        actionsPanel.addView(snoozeLabel, full(18));

        LinearLayout snoozeRow = row();
        int[] options = {5, 10, 15, 30, 60};
        for (int i = 0; i < options.length; i++) {
            final int m = options[i];
            TextView chip = button(m == 60 ? "1 h" : m + " min", CHIP, INK_SOFT, LINE, 50, 15,
                    v -> AlarmActions.handle(this, alarm, AlarmActions.SNOOZE, m));
            chip.setPadding(dp(2), dp(4), dp(2), dp(4));
            chip.setMaxLines(1);
            snoozeRow.addView(chip, weighted(i == 0 ? 0 : 3, i == options.length - 1 ? 0 : 3));
        }
        actionsPanel.addView(snoozeRow, full(8));

        // "Recebi": stops this alert (stays pending in the notification); "Silenciar": options
        LinearLayout lower = row();
        lower.addView(button("👁  Recebi", Color.TRANSPARENT, INK_SOFT, Color.parseColor("#D8CDBE"), 52, 16,
                v -> silenceCurrent()), weighted(0, 4));
        lower.addView(button("🔕  Silenciar", Color.TRANSPARENT, INK_SOFT, Color.parseColor("#D8CDBE"), 52, 16,
                v -> showMute(true)), weighted(4, 0));
        actionsPanel.addView(lower, full(14));

        // ---- Silence options (replace the answers while open)
        mutePanel = column();
        mutePanel.setVisibility(View.GONE);
        card.addView(mutePanel, full(0));

        TextView muteTitle = text("Silenciar alarmes", 19, INK, Typeface.BOLD);
        muteTitle.setGravity(Gravity.START);
        mutePanel.addView(muteTitle, full(0));
        TextView muteHint = text("Pausa só os avisos (som, voz e vibração). As tarefas e os horários não mudam.", 14, MUTED, Typeface.NORMAL);
        muteHint.setGravity(Gravity.START);
        muteHint.setLineSpacing(0, 1.15f);
        mutePanel.addView(muteHint, full(6));

        mutePanel.addView(button("Só este aviso", Color.parseColor("#F1E9DE"), INK_SOFT, 0, 50, 16, v -> silenceCurrent()), full(16));

        String[][] grid = {{"1 hora", "60"}, {"2 horas", "120"}, {"3 horas", "180"}, {"Resto do dia", "-2"}};
        for (int i = 0; i < grid.length; i += 2) {
            LinearLayout pair = row();
            for (int j = 0; j < 2; j++) {
                final int minutes = Integer.parseInt(grid[i + j][1]);
                pair.addView(button(grid[i + j][0], CHIP, INK_SOFT, LINE, 50, 16, v -> muteFor(minutes)), weighted(j == 0 ? 0 : 4, j == 0 ? 4 : 0));
            }
            mutePanel.addView(pair, full(8));
        }
        mutePanel.addView(button("Até eu reativar", accentDark, Color.WHITE, 0, 52, 16, v -> muteFor(-1)), full(8));
        mutePanel.addView(button("Voltar", Color.TRANSPARENT, MUTED, 0, 46, 15, v -> showMute(false)), full(4));

        return root;
    }

    private void showMute(boolean show) {
        actionsPanel.setVisibility(show ? View.GONE : View.VISIBLE);
        mutePanel.setVisibility(show ? View.VISIBLE : View.GONE);
    }

    /** "Só este aviso": stops this alarm's sound; it stays in the notification bar to answer later. */
    private void silenceCurrent() {
        try {
            Intent i = new Intent(this, AlarmService.class);
            i.setAction(AlarmService.ACTION_SILENCE_CURRENT);
            startService(i);
        } catch (Exception ignored) {
        }
        finish();
    }

    /** minutes = -1: until reactivated; -2: rest of the day. Tasks are never changed, only the alerts. */
    private void muteFor(int minutes) {
        long until;
        if (minutes == -1) until = MuteManager.MUTE_FOREVER;
        else if (minutes == -2) {
            java.util.Calendar c = java.util.Calendar.getInstance();
            c.set(java.util.Calendar.HOUR_OF_DAY, 23);
            c.set(java.util.Calendar.MINUTE, 59);
            c.set(java.util.Calendar.SECOND, 59);
            until = c.getTimeInMillis();
        } else until = System.currentTimeMillis() + minutes * 60L * 1000L;
        MuteManager.setMute(this, until);
        finish();
    }
}
