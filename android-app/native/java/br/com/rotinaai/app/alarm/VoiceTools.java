package br.com.rotinaai.app.alarm;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/** Voice chosen in Configurações: listing, preview and applying it to a TextToSpeech. */
final class VoiceTools {
    private static TextToSpeech previewTts;
    private static boolean ready = false;
    private static final List<Runnable> waiting = new ArrayList<>();

    private VoiceTools() {
    }

    /** Runs `r` once the preview voice engine is ready (or failed to start). */
    static synchronized void withPreviewTts(Context c, Runnable r) {
        if (previewTts != null && ready) {
            r.run();
            return;
        }
        waiting.add(r);
        if (previewTts != null) return;
        previewTts = new TextToSpeech(c.getApplicationContext(), status -> {
            List<Runnable> run;
            synchronized (VoiceTools.class) {
                ready = status == TextToSpeech.SUCCESS;
                if (ready) {
                    previewTts.setLanguage(new Locale("pt", "BR"));
                    useAlarmVolume(previewTts);
                } else {
                    previewTts = null;
                }
                run = new ArrayList<>(waiting);
                waiting.clear();
            }
            for (Runnable x : run) x.run();
        });
    }

    static synchronized TextToSpeech previewTts() {
        return ready ? previewTts : null;
    }

    static void useAlarmVolume(TextToSpeech tts) {
        if (tts == null || Build.VERSION.SDK_INT < 21) return;
        tts.setAudioAttributes(new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_ALARM)
                .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                .build());
    }

    /** Portuguese voices installed (or downloadable) on this phone. */
    static List<Voice> portugueseVoices(TextToSpeech tts) {
        List<Voice> out = new ArrayList<>();
        if (tts == null || Build.VERSION.SDK_INT < 21) return out;
        try {
            Set<Voice> all = tts.getVoices();
            if (all == null) return out;
            for (Voice v : all) {
                Locale l = v.getLocale();
                if (l == null || !"pt".equals(l.getLanguage())) continue;
                Set<String> f = v.getFeatures();
                if (f != null && f.contains(TextToSpeech.Engine.KEY_FEATURE_NOT_INSTALLED)) continue;
                out.add(v);
            }
        } catch (Exception ignored) {
        }
        return out;
    }

    /** Applies the chosen voice, speed and pitch (empty name = phone default). */
    static void apply(TextToSpeech tts, String voiceName, float rate, float pitch) {
        if (tts == null) return;
        try {
            if (voiceName != null && !voiceName.isEmpty() && Build.VERSION.SDK_INT >= 21) {
                for (Voice v : portugueseVoices(tts)) {
                    if (voiceName.equals(v.getName())) {
                        tts.setVoice(v);
                        break;
                    }
                }
            }
            tts.setSpeechRate(rate > 0 ? rate : 0.95f);
            tts.setPitch(pitch > 0 ? pitch : 1.0f);
        } catch (Exception ignored) {
        }
    }

    static void speakOnAlarmVolume(TextToSpeech tts, String text, String utteranceId) {
        if (tts == null || text == null || text.isEmpty()) return;
        Bundle params = new Bundle();
        params.putInt(TextToSpeech.Engine.KEY_PARAM_STREAM, AudioManager.STREAM_ALARM);
        tts.speak(text, TextToSpeech.QUEUE_FLUSH, params, utteranceId);
    }
}
