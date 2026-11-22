package br.com.rotinaai.app.alarm;

import android.content.Context;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.Signature;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.security.MessageDigest;

/**
 * Updates the app from inside it: reads the published version (android-version.json),
 * downloads the new APK and opens the Android installer (the person taps "Atualizar").
 */
public class AppUpdater {
    public static final String AUTHORITY = "br.com.rotinaai.app.updates";

    public interface Progress {
        void onProgress(long received, long total);
    }

    public static long versionCode(Context c) {
        try {
            PackageInfo info = c.getPackageManager().getPackageInfo(c.getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? info.getLongVersionCode() : info.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    public static String versionName(Context c) {
        try {
            return c.getPackageManager().getPackageInfo(c.getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "";
        }
    }

    /** SHA-256 of the signing certificate (AA:BB:...), to know if an update can install over this app. */
    @SuppressWarnings("deprecation")
    public static String signatureSha256(Context c) {
        try {
            PackageManager pm = c.getPackageManager();
            Signature[] sigs;
            if (Build.VERSION.SDK_INT >= 28) {
                PackageInfo info = pm.getPackageInfo(c.getPackageName(), PackageManager.GET_SIGNING_CERTIFICATES);
                sigs = info.signingInfo.getApkContentsSigners();
            } else {
                sigs = pm.getPackageInfo(c.getPackageName(), PackageManager.GET_SIGNATURES).signatures;
            }
            if (sigs == null || sigs.length == 0) return "";
            byte[] d = MessageDigest.getInstance("SHA-256").digest(sigs[0].toByteArray());
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < d.length; i++) {
                if (i > 0) sb.append(':');
                sb.append(String.format("%02X", d[i]));
            }
            return sb.toString();
        } catch (Exception e) {
            return "";
        }
    }

    public static boolean canInstall(Context c) {
        return Build.VERSION.SDK_INT < 26 || c.getPackageManager().canRequestPackageInstalls();
    }

    private static HttpURLConnection open(String url) throws Exception {
        HttpURLConnection con = (HttpURLConnection) new URL(url).openConnection();
        con.setInstanceFollowRedirects(true);
        con.setConnectTimeout(15000);
        con.setReadTimeout(30000);
        con.setRequestProperty("Cache-Control", "no-cache");
        // GitHub sends release files through a redirect to another https host
        int code = con.getResponseCode();
        int hops = 0;
        while ((code == 301 || code == 302 || code == 303 || code == 307 || code == 308) && hops++ < 5) {
            String next = con.getHeaderField("Location");
            con.disconnect();
            con = (HttpURLConnection) new URL(new URL(url), next).openConnection();
            con.setConnectTimeout(15000);
            con.setReadTimeout(30000);
            code = con.getResponseCode();
        }
        if (code != 200) throw new Exception("HTTP " + code);
        return con;
    }

    /** Reads the published version info. */
    public static JSONObject fetchLatest(String url) throws Exception {
        HttpURLConnection con = open(url + (url.contains("?") ? "&" : "?") + "t=" + System.currentTimeMillis());
        try (InputStream in = con.getInputStream(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buf = new byte[8192];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return new JSONObject(out.toString("UTF-8"));
        } finally {
            con.disconnect();
        }
    }

    public static File apkFile(Context c) {
        File dir = new File(c.getCacheDir(), "updates");
        //noinspection ResultOfMethodCallIgnored
        dir.mkdirs();
        return new File(dir, "rotina-ai-update.apk");
    }

    /** Downloads the new APK to the app cache, reporting progress. */
    public static File download(Context c, String url, Progress progress) throws Exception {
        File target = apkFile(c);
        File part = new File(target.getPath() + ".part");
        HttpURLConnection con = open(url);
        long total = con.getContentLengthLong() > 0 ? con.getContentLengthLong() : con.getContentLength();
        long received = 0;
        long lastReport = 0;
        try (InputStream in = con.getInputStream(); FileOutputStream out = new FileOutputStream(part)) {
            byte[] buf = new byte[32 * 1024];
            int n;
            while ((n = in.read(buf)) > 0) {
                out.write(buf, 0, n);
                received += n;
                long now = System.currentTimeMillis();
                if (now - lastReport > 250) {
                    lastReport = now;
                    progress.onProgress(received, total);
                }
            }
        } finally {
            con.disconnect();
        }
        if (total > 0 && received < total) throw new Exception("Download incompleto");
        //noinspection ResultOfMethodCallIgnored
        target.delete();
        if (!part.renameTo(target)) throw new Exception("Não foi possível salvar a atualização");
        progress.onProgress(received, received);
        return target;
    }

    /** Opens the Android installer for the downloaded update. */
    public static void install(Context c) throws Exception {
        File f = apkFile(c);
        if (!f.exists()) throw new Exception("Atualização ainda não baixada");
        Uri uri = FileProvider.getUriForFile(c, AUTHORITY, f);
        Intent i = new Intent(Intent.ACTION_VIEW);
        i.setDataAndType(uri, "application/vnd.android.package-archive");
        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
        c.startActivity(i);
    }

    /** "Instalar apps desconhecidos" screen for this app (Android 8+). */
    public static void openInstallPermission(Context c) {
        Intent i = Build.VERSION.SDK_INT >= 26
                ? new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + c.getPackageName()))
                : new Intent(Settings.ACTION_SECURITY_SETTINGS);
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        c.startActivity(i);
    }
}
