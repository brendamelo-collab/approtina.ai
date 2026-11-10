package br.com.rotinaai.app.alarm;

import android.content.Context;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioTrack;
import android.media.Ringtone;
import android.media.RingtoneManager;
import android.net.Uri;
import android.os.Build;

/**
 * Alarm sounds chosen in Configurações. Each sound is a short list of notes rendered to PCM,
 * the same notes the website uses for the preview (src/utils/alarmSounds.ts), so the preview
 * and the real alarm sound alike. "padrao" keeps the original beeps; "celular" uses the
 * phone's own alarm ringtone.
 */
final class SoundSynth {
    static final int RATE = 22050;

    private SoundSynth() {
    }

    // note = {startFreq, endFreq, startSec, durationSec, wave(0 sine,1 triangle,2 square,3 saw), volume, pluck(1)/flat(0)}
    static double[][] spec(String id) {
        if (id == null) return null;
        switch (id) {
            case "sino":
                return new double[][]{
                        {880, 880, 0, 1.6, 0, .45, 1}, {1760, 1760, 0, 1.0, 0, .12, 1}, {2640, 2640, 0, .6, 0, .05, 1},
                        {660, 660, 1.7, 1.8, 0, .45, 1}, {1320, 1320, 1.7, 1.1, 0, .12, 1}};
            case "marimba":
                return new double[][]{
                        {523.25, 523.25, 0, .45, 1, .5, 1}, {659.25, 659.25, .16, .45, 1, .5, 1},
                        {783.99, 783.99, .32, .45, 1, .5, 1}, {1046.5, 1046.5, .48, .6, 1, .5, 1},
                        {523.25, 523.25, 1.2, .45, 1, .5, 1}, {659.25, 659.25, 1.36, .45, 1, .5, 1},
                        {783.99, 783.99, 1.52, .45, 1, .5, 1}, {1046.5, 1046.5, 1.68, .8, 1, .5, 1}};
            case "harpa":
                return new double[][]{
                        {440, 440, 0, 1.4, 0, .32, 1}, {554.37, 554.37, .11, 1.4, 0, .32, 1},
                        {659.25, 659.25, .22, 1.4, 0, .32, 1}, {880, 880, .33, 1.4, 0, .32, 1},
                        {1108.73, 1108.73, .44, 1.4, 0, .3, 1}, {1318.51, 1318.51, .55, 1.6, 0, .28, 1}};
            case "digital":
                return new double[][]{
                        {988, 988, 0, .1, 2, .18, 0}, {988, 988, .18, .1, 2, .18, 0}, {988, 988, .36, .1, 2, .18, 0},
                        {988, 988, .54, .1, 2, .18, 0}, {988, 988, 1.2, .1, 2, .18, 0}, {988, 988, 1.38, .1, 2, .18, 0},
                        {988, 988, 1.56, .1, 2, .18, 0}, {988, 988, 1.74, .1, 2, .18, 0}};
            case "pulso":
                return new double[][]{
                        {1175, 1175, 0, .07, 3, .16, 0}, {1175, 1175, .13, .07, 3, .16, 0}, {1175, 1175, .26, .07, 3, .16, 0},
                        {1175, 1175, .39, .07, 3, .16, 0}, {1175, 1175, .52, .07, 3, .16, 0}, {1175, 1175, .65, .07, 3, .16, 0},
                        {1175, 1175, 1.1, .07, 3, .16, 0}, {1175, 1175, 1.23, .07, 3, .16, 0}, {1175, 1175, 1.36, .07, 3, .16, 0},
                        {1175, 1175, 1.49, .07, 3, .16, 0}, {1175, 1175, 1.62, .07, 3, .16, 0}, {1175, 1175, 1.75, .07, 3, .16, 0}};
            case "suave":
                return new double[][]{{587.33, 880, 0, 1.2, 0, .3, 1}, {587.33, 880, 1.5, 1.2, 0, .3, 1}};
            default:
                return null;
        }
    }

    static short[] render(String id) {
        double[][] notes = spec(id);
        if (notes == null || notes.length == 0) return null;
        double end = 0;
        for (double[] n : notes) end = Math.max(end, n[2] + n[3]);
        int len = (int) Math.ceil((end + 0.05) * RATE);
        float[] buf = new float[len];
        for (double[] n : notes) {
            double f0 = n[0], f1 = n[1], start = n[2], dur = n[3], vol = n[5];
            int wave = (int) n[4];
            boolean pluck = n[6] > 0.5;
            int s0 = (int) (start * RATE);
            int count = (int) (dur * RATE);
            double phase = 0;
            for (int i = 0; i < count && s0 + i < len; i++) {
                double t = (double) i / RATE;
                double f = f0 + (f1 - f0) * (t / dur);
                phase += 2 * Math.PI * f / RATE;
                double s;
                switch (wave) {
                    case 1:
                        s = (2 / Math.PI) * Math.asin(Math.sin(phase));
                        break;
                    case 2:
                        s = Math.sin(phase) >= 0 ? 1 : -1;
                        break;
                    case 3: {
                        double x = phase / (2 * Math.PI);
                        s = 2 * (x - Math.floor(x)) - 1;
                        break;
                    }
                    default:
                        s = Math.sin(phase);
                }
                double env = Math.min(1, t / 0.005);
                if (pluck) env *= Math.exp(-5 * t / dur);
                else env *= Math.max(0, Math.min(1, (dur - t) / 0.01));
                buf[s0 + i] += (float) (s * vol * env);
            }
        }
        float max = 0;
        for (float v : buf) max = Math.max(max, Math.abs(v));
        float k = max > 0.95f ? 0.95f / max : 1f;
        short[] out = new short[len];
        for (int i = 0; i < len; i++) out[i] = (short) (buf[i] * k * 32767);
        return out;
    }

    static long durationMs(short[] pcm) {
        return pcm == null ? 0 : pcm.length * 1000L / RATE;
    }

    /** Plays the sound once on the alarm volume. Returns the track so it can be stopped. */
    static AudioTrack play(short[] pcm) {
        if (pcm == null || pcm.length == 0) return null;
        try {
            int bytes = pcm.length * 2;
            AudioTrack track;
            if (Build.VERSION.SDK_INT >= 23) {
                track = new AudioTrack.Builder()
                        .setAudioAttributes(new AudioAttributes.Builder()
                                .setUsage(AudioAttributes.USAGE_ALARM)
                                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                                .build())
                        .setAudioFormat(new AudioFormat.Builder()
                                .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                                .setSampleRate(RATE)
                                .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                                .build())
                        .setBufferSizeInBytes(bytes)
                        .setTransferMode(AudioTrack.MODE_STATIC)
                        .build();
            } else {
                track = new AudioTrack(AudioManager.STREAM_ALARM, RATE, AudioFormat.CHANNEL_OUT_MONO,
                        AudioFormat.ENCODING_PCM_16BIT, bytes, AudioTrack.MODE_STATIC);
            }
            track.write(pcm, 0, pcm.length);
            track.play();
            return track;
        } catch (Exception e) {
            return null;
        }
    }

    static void release(AudioTrack track) {
        if (track == null) return;
        try {
            track.stop();
        } catch (Exception ignored) {
        }
        try {
            track.release();
        } catch (Exception ignored) {
        }
    }

    /** The phone's own alarm ringtone (falls back to the notification sound). */
    static Ringtone phoneRingtone(Context c) {
        try {
            Uri uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_ALARM);
            if (uri == null) uri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION);
            Ringtone r = RingtoneManager.getRingtone(c, uri);
            if (r != null && Build.VERSION.SDK_INT >= 21) {
                r.setAudioAttributes(new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_ALARM)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
            }
            return r;
        } catch (Exception e) {
            return null;
        }
    }
}
