package com.elementarenasi.oyun;

import android.app.AlertDialog;
import android.app.ProgressDialog;
import android.content.Context;
import android.content.DialogInterface;
import android.content.SharedPreferences;
import android.content.Intent;
import android.content.res.AssetManager;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;
import android.widget.Toast;
import androidx.core.content.FileProvider;
import java.io.BufferedInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.InetAddress;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.net.URL;
import java.net.URLDecoder;
import java.security.SecureRandom;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.TimeUnit;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.security.MessageDigest;
import java.io.FileInputStream;
import org.json.JSONArray;
import org.json.JSONObject;

/* Uygulamanın içindeki küçük yerel sunucu (yalnızca bu telefondan, 127.0.0.1).
   - /...        : oyun dosyaları: indirilen en yeni oyun paketi (files/web/<sürüm>) ya da APK'nın içindeki (assets/www)
   - /__ea/...   : Android köprüsü; her açılışta değişen gizli anahtarla korunur */
final class LocalServer {
    private static LocalServer I;
    final String token;
    private final Context app;
    private volatile MainActivity act;
    private ServerSocket ss;
    private int port;
    private final ExecutorService pool = Executors.newCachedThreadPool();
    private final LinkedBlockingQueue<JSONObject> events = new LinkedBlockingQueue<>();

    static synchronized LocalServer get(MainActivity a) {
        if (I == null) { I = new LocalServer(a.getApplicationContext()); I.start(); }
        I.act = a;
        return I;
    }

    private LocalServer(Context c) {
        app = c;
        pickWeb();
        byte[] b = new byte[16];
        new SecureRandom().nextBytes(b);
        StringBuilder s = new StringBuilder();
        for (byte x : b) s.append(String.format(Locale.US, "%02x", x));
        token = s.toString();
    }

    String base() { return "http://127.0.0.1:" + port + "/"; }

    // ---------------- Kurulumsuz oyun güncellemesi ----------------
    // Oyunun kendisi (HTML/JS) GitHub sürümündeki ElementArenasi-web.zip ile güncellenir; APK yalnızca
    // Android tarafı (NATIVE) değişince gerekir. Yeni paket açılamazsa bir sonraki açılışta eski hale dönülür.
    static final int NATIVE = BuildConfig.EA_NATIVE;
    private volatile File webRoot = null;
    private volatile String webTag = null;

    private SharedPreferences sp() { return app.getSharedPreferences("ea", Context.MODE_PRIVATE); }

    private String appVer() {
        try { return app.getPackageManager().getPackageInfo(app.getPackageName(), 0).versionName; } catch (Exception e) { return "0"; }
    }

    static boolean newer(String a, String b) {
        String[] x = a.replaceFirst("^v", "").split("\\."), y = b.replaceFirst("^v", "").split("\\.");
        for (int i = 0; i < 3; i++) {
            int p = 0, q = 0;
            try { p = i < x.length ? Integer.parseInt(x[i]) : 0; } catch (Exception e) { }
            try { q = i < y.length ? Integer.parseInt(y[i]) : 0; } catch (Exception e) { }
            if (p != q) return p > q;
        }
        return false;
    }

    private File webDir(String tag) { return new File(new File(app.getFilesDir(), "web"), tag.replaceAll("[^0-9A-Za-z._-]", "")); }

    private static void rmrf(File f) {
        if (f == null || !f.exists()) return;
        File[] l = f.listFiles();
        if (l != null) for (File c : l) rmrf(c);
        f.delete();
    }

    private synchronized void pickWeb() {
        SharedPreferences p = sp();
        SharedPreferences.Editor e = p.edit();
        String cur = p.getString("web", null), pend = p.getString("pend", null);
        // önceki açılışta yeni paket hiç "açıldım" demediyse geri al
        if (cur != null && p.getBoolean("trial", false)) { e.putString("bad", cur); rmrf(webDir(cur)); cur = null; e.remove("web").remove("trial"); }
        if (pend != null) {
            if (!pend.equals(p.getString("bad", "")) && webDir(pend).isDirectory()) { cur = pend; e.putString("web", pend).putBoolean("trial", true); }
            e.remove("pend");
        }
        // APK daha yeniyse (ya da aynıysa) indirilmiş paketi bırak
        if (cur != null && (!newer(cur, appVer()) || !new File(webDir(cur), "index.html").isFile())) { rmrf(webDir(cur)); cur = null; e.remove("web").remove("trial"); }
        e.commit();
        webTag = cur;
        webRoot = cur != null ? webDir(cur) : null;
        cleanWeb();
    }

    private void cleanWeb() {
        File[] l = new File(app.getFilesDir(), "web").listFiles();
        String pend = sp().getString("pend", null);
        if (l != null) for (File f : l) {
            String n = f.getName();
            if (n.equals(webTag) || n.equals(pend)) continue;
            rmrf(f);
        }
    }

    private static String sha256(File f) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        InputStream in = new FileInputStream(f);
        byte[] b = new byte[65536];
        int n;
        while ((n = in.read(b)) > 0) md.update(b, 0, n);
        in.close();
        StringBuilder s = new StringBuilder();
        for (byte x : md.digest()) s.append(String.format(Locale.US, "%02x", x));
        return s.toString();
    }

    private synchronized JSONObject webUpdate(String url, String tag, String sha) throws Exception {
        if (!url.startsWith("https://github.com/") || tag.isEmpty()) throw new Exception("adres");
        if (!newer(tag, webTag != null ? webTag : appVer())) return new JSONObject().put("ok", false).put("error", "eski");
        if (tag.equals(sp().getString("bad", ""))) return new JSONObject().put("ok", false).put("error", "bozuk");
        File dir = webDir(tag);
        if (dir.isDirectory() && tag.equals(sp().getString("pend", null))) return new JSONObject().put("ok", true).put("tag", tag);
        File zip = new File(app.getCacheDir(), "web.zip"), tmp = new File(dir.getPath() + ".tmp");
        fetch(url, zip, null);
        if (sha != null && sha.length() == 64 && !sha.equalsIgnoreCase(sha256(zip))) { zip.delete(); throw new Exception("paket doğrulanamadı"); }
        rmrf(tmp);
        tmp.mkdirs();
        String root = tmp.getCanonicalPath() + File.separator;
        ZipInputStream z = new ZipInputStream(new FileInputStream(zip));
        try {
            ZipEntry en;
            byte[] b = new byte[65536];
            while ((en = z.getNextEntry()) != null) {
                File o = new File(tmp, en.getName());
                if (!o.getCanonicalPath().startsWith(root)) throw new Exception("paket");
                if (en.isDirectory()) { o.mkdirs(); continue; }
                o.getParentFile().mkdirs();
                OutputStream w = new FileOutputStream(o);
                int n;
                while ((n = z.read(b)) > 0) w.write(b, 0, n);
                w.close();
            }
        } catch (Exception e) {
            rmrf(tmp);
            throw e;
        } finally {
            z.close();
            zip.delete();
        }
        int need = 1;
        try {
            InputStream nin = new FileInputStream(new File(tmp, "native.txt"));
            byte[] nb = new byte[16];
            int nn = nin.read(nb);
            nin.close();
            need = Integer.parseInt(new String(nb, 0, Math.max(0, nn), "UTF-8").trim());
        } catch (Exception e) { }
        if (need > NATIVE || !new File(tmp, "index.html").isFile()) {
            rmrf(tmp);
            return new JSONObject().put("ok", false).put("need", need).put("error", need > NATIVE ? "apk" : "paket");
        }
        rmrf(dir);
        if (!tmp.renameTo(dir)) throw new Exception("paket yazılamadı");
        sp().edit().putString("pend", tag).commit();
        cleanWeb();
        return new JSONObject().put("ok", true).put("tag", tag);
    }

    // indirilen paketi hemen kullanmaya başla (oyun sayfası ardından kendini yeniler)
    private synchronized JSONObject webApply(String tag) throws Exception {
        if (!tag.equals(sp().getString("pend", null)) || !webDir(tag).isDirectory()) return new JSONObject().put("ok", false);
        sp().edit().putString("web", tag).putBoolean("trial", true).remove("pend").commit();
        webTag = tag;
        webRoot = webDir(tag);
        cleanWeb();
        return new JSONObject().put("ok", true);
    }

    void push(JSONObject e) { events.offer(e); }

    // Sabit port: oyunun kayıtları (ayarlar, oturum) bu adrese bağlı olduğu için her açılışta aynı kalmalı.
    private void start() {
        int[] ports = {47811, 47812, 47813, 47814, 0};
        for (int p : ports) {
            try {
                ServerSocket s = new ServerSocket();
                s.setReuseAddress(true);
                s.bind(new InetSocketAddress(InetAddress.getByName("127.0.0.1"), p), 64);
                ss = s;
                port = s.getLocalPort();
                break;
            } catch (Exception e) { }
        }
        Thread t = new Thread(new Runnable() {
            public void run() {
                while (true) {
                    try {
                        final Socket c = ss.accept();
                        pool.execute(new Runnable() { public void run() { handle(c); } });
                    } catch (Exception e) {
                        try { Thread.sleep(50); } catch (InterruptedException ie) { return; }
                    }
                }
            }
        }, "ea-server");
        t.setDaemon(true);
        t.start();
    }

    // ---------------- HTTP ----------------
    private static String readLine(InputStream in) throws Exception {
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        int c;
        while ((c = in.read()) != -1) {
            if (c == '\n') break;
            if (c != '\r') b.write(c);
            if (b.size() > 16384) throw new Exception("satır çok uzun");
        }
        if (c == -1 && b.size() == 0) return null;
        return b.toString("UTF-8");
    }

    private void handle(Socket c) {
        try {
            c.setSoTimeout(30000);
            InputStream in = new BufferedInputStream(c.getInputStream());
            OutputStream out = c.getOutputStream();
            String line = readLine(in);
            if (line == null) { c.close(); return; }
            String[] rl = line.split(" ");
            if (rl.length < 2) { c.close(); return; }
            String method = rl[0], target = rl[1];
            Map<String, String> h = new HashMap<>();
            String l;
            while ((l = readLine(in)) != null && l.length() > 0) {
                int i = l.indexOf(':');
                if (i > 0) h.put(l.substring(0, i).trim().toLowerCase(Locale.US), l.substring(i + 1).trim());
            }
            byte[] body = new byte[0];
            int len = 0;
            try { len = Integer.parseInt(h.containsKey("content-length") ? h.get("content-length") : "0"); } catch (Exception e) { }
            if (len > 0 && len < 1 << 20) {
                body = new byte[len];
                int got = 0;
                while (got < len) { int n = in.read(body, got, len - got); if (n < 0) break; got += n; }
            }
            String path = target;
            int q = path.indexOf('?');
            if (q >= 0) path = path.substring(0, q);
            path = URLDecoder.decode(path, "UTF-8");
            if (path.startsWith("/__ea/")) {
                JSONObject r;
                if (!token.equals(h.get("x-ea"))) {
                    send(out, 403, "application/json", "{\"error\":\"izin yok\"}".getBytes("UTF-8"), false);
                } else {
                    JSONObject a;
                    try { a = new JSONObject(len > 0 ? new String(body, "UTF-8") : "{}"); } catch (Exception e) { a = new JSONObject(); }
                    try { r = api(path.substring(6), a); } catch (Exception e) { r = new JSONObject().put("error", e.getMessage() == null ? "hata" : e.getMessage()); }
                    send(out, 200, "application/json; charset=utf-8", r.toString().getBytes("UTF-8"), false);
                }
            } else {
                serveAsset(out, path, "HEAD".equals(method));
            }
            out.flush();
        } catch (Exception e) {
        } finally {
            try { c.close(); } catch (Exception e) { }
        }
    }

    private static void send(OutputStream out, int code, String type, byte[] data, boolean headOnly) throws Exception {
        String st = code == 200 ? "OK" : code == 404 ? "Not Found" : code == 403 ? "Forbidden" : "Error";
        String hd = "HTTP/1.1 " + code + " " + st + "\r\nContent-Type: " + type + "\r\nContent-Length: " + data.length
                + "\r\nCache-Control: no-cache\r\nX-Content-Type-Options: nosniff\r\nConnection: close\r\n\r\n";
        out.write(hd.getBytes("UTF-8"));
        if (!headOnly) out.write(data);
    }

    private static String type(String p) {
        String e = p.substring(p.lastIndexOf('.') + 1).toLowerCase(Locale.US);
        switch (e) {
            case "html": case "htm": return "text/html; charset=utf-8";
            case "js": case "mjs": return "text/javascript; charset=utf-8";
            case "css": return "text/css; charset=utf-8";
            case "json": return "application/json; charset=utf-8";
            case "md": case "txt": return "text/plain; charset=utf-8";
            case "svg": return "image/svg+xml";
            case "png": return "image/png";
            case "jpg": case "jpeg": return "image/jpeg";
            case "webp": return "image/webp";
            case "gif": return "image/gif";
            case "ico": return "image/x-icon";
            case "glb": return "model/gltf-binary";
            case "gltf": return "model/gltf+json";
            case "mp3": return "audio/mpeg";
            case "ogg": return "audio/ogg";
            case "wav": return "audio/wav";
            case "mp4": return "video/mp4";
            case "woff2": return "font/woff2";
            case "woff": return "font/woff";
            case "ttf": return "font/ttf";
            case "wasm": return "application/wasm";
            default: return "application/octet-stream";
        }
    }

    private void serveAsset(OutputStream out, String path, boolean head) throws Exception {
        if (path.endsWith("/")) path += "index.html";
        if (path.contains("..")) { send(out, 403, "text/plain", new byte[0], head); return; }
        AssetManager am = app.getAssets();
        InputStream in = null;
        File wr = webRoot;
        if (wr != null) {
            File f = new File(wr, path);
            if (f.isFile() && f.getCanonicalPath().startsWith(wr.getCanonicalPath() + File.separator)) in = new FileInputStream(f);
        }
        if (in == null) try { in = am.open("www" + path); } catch (Exception e) {
            send(out, 404, "text/plain; charset=utf-8", "yok".getBytes("UTF-8"), head);
            return;
        }
        ByteArrayOutputStream b = new ByteArrayOutputStream();
        byte[] buf = new byte[65536];
        int n;
        while ((n = in.read(buf)) > 0) b.write(buf, 0, n);
        in.close();
        send(out, 200, type(path), b.toByteArray(), head);
    }

    // ---------------- Android köprüsü ----------------
    private interface Ui { void run(MainActivity a) throws Exception; }

    private void ui(final Ui f) {
        final MainActivity a = act;
        if (a == null) return;
        a.runOnUiThread(new Runnable() { public void run() { try { f.run(a); } catch (Exception e) { } } });
    }

    private JSONObject api(String m, final JSONObject a) throws Exception {
        final JSONObject ok = new JSONObject().put("ok", true);
        switch (m) {
            case "events": {
                JSONArray arr = new JSONArray();
                JSONObject e = events.poll(20, TimeUnit.SECONDS);
                while (e != null) { arr.put(e); e = events.poll(); }
                return new JSONObject().put("ev", arr);
            }
            case "info": {
                String ver = "?";
                try { ver = app.getPackageManager().getPackageInfo(app.getPackageName(), 0).versionName; } catch (Exception e) { }
                return new JSONObject().put("abi", Build.SUPPORTED_ABIS.length > 0 ? Build.SUPPORTED_ABIS[0] : "")
                        .put("sdk", Build.VERSION.SDK_INT).put("android", Build.VERSION.RELEASE)
                        .put("model", Build.MANUFACTURER + " " + Build.MODEL).put("app", ver)
                        .put("bits", android.os.Process.is64Bit() ? 64 : 32).put("native", NATIVE).put("web", webTag == null ? "" : webTag);
            }
            case "webUpdate": return webUpdate(a.optString("url", ""), a.optString("tag", ""), a.optString("sha", ""));
            case "webApply": return webApply(a.optString("tag", ""));
            case "booted": {
                if (webTag != null && sp().getBoolean("trial", false)) sp().edit().putBoolean("trial", false).remove("bad").commit();
                return ok;
            }
            case "open": {
                final String u = a.optString("url", "");
                if (!(u.startsWith("https://") || u.startsWith("http://"))) throw new Exception("adres");
                ui(new Ui() { public void run(MainActivity x) { x.openExternal(u); } });
                return ok;
            }
            case "toast": {
                final String t = a.optString("text", "");
                ui(new Ui() { public void run(MainActivity x) { Toast.makeText(x, t, Toast.LENGTH_LONG).show(); } });
                return ok;
            }
            case "alert": {
                final String t = a.optString("title", "Element Arenası"), msg = a.optString("message", "");
                ui(new Ui() { public void run(MainActivity x) {
                    new AlertDialog.Builder(x, android.R.style.Theme_DeviceDefault_Dialog_Alert).setTitle(t).setMessage(msg).setPositiveButton("Tamam", null).show();
                } });
                return ok;
            }
            case "confirm": {
                final String t = a.optString("title", "Element Arenası"), msg = a.optString("message", "");
                final String yes = a.optString("ok", "Tamam"), no = a.has("cancel") && !a.isNull("cancel") ? a.optString("cancel") : null;
                final boolean[] res = {false};
                final CountDownLatch done = new CountDownLatch(1);
                if (act == null) return new JSONObject().put("ok", false);
                ui(new Ui() { public void run(MainActivity x) {
                    AlertDialog.Builder b = new AlertDialog.Builder(x, android.R.style.Theme_DeviceDefault_Dialog_Alert).setTitle(t).setMessage(msg).setCancelable(false);
                    b.setPositiveButton(yes, new DialogInterface.OnClickListener() { public void onClick(DialogInterface d, int w) { res[0] = true; done.countDown(); } });
                    if (no != null) b.setNegativeButton(no, new DialogInterface.OnClickListener() { public void onClick(DialogInterface d, int w) { done.countDown(); } });
                    b.show();
                } });
                // cevap gelene kadar bekle (bağlantı açık kalır)
                while (!done.await(25, TimeUnit.SECONDS)) { }
                return new JSONObject().put("ok", res[0]);
            }
            case "download": return download(a.optString("url", ""), a.optString("title", null));
            case "canInstall": {
                boolean can = Build.VERSION.SDK_INT < 26 || app.getPackageManager().canRequestPackageInstalls();
                return new JSONObject().put("ok", can);
            }
            case "settings": {
                ui(new Ui() { public void run(MainActivity x) {
                    x.startActivity(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES, Uri.parse("package:" + x.getPackageName())));
                } });
                return ok;
            }
            case "install": {
                final File f = apkFile();
                if (!f.exists()) throw new Exception("dosya yok");
                ui(new Ui() { public void run(MainActivity x) {
                    Uri uri = FileProvider.getUriForFile(x, x.getPackageName() + ".fileprovider", f);
                    Intent i = new Intent(Intent.ACTION_VIEW);
                    i.setDataAndType(uri, "application/vnd.android.package-archive");
                    i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
                    x.startActivity(i);
                } });
                return ok;
            }
            default: throw new Exception("bilinmeyen: " + m);
        }
    }

    private File apkFile() {
        File d = new File(app.getCacheDir(), "update");
        d.mkdirs();
        return new File(d, "ElementArenasi.apk");
    }

    @SuppressWarnings("deprecation")
    private ProgressDialog pd;

    @SuppressWarnings("deprecation")
    private JSONObject download(String u, final String title) throws Exception {
        if (!u.startsWith("https://")) throw new Exception("adres");
        long got = fetch(u, apkFile(), title);
        return new JSONObject().put("ok", true).put("size", got);
    }

    @SuppressWarnings("deprecation")
    private long fetch(String u, File f, final String title) throws Exception {
        if (title != null) ui(new Ui() { public void run(MainActivity x) {
            if (pd != null) pd.dismiss();
            pd = new ProgressDialog(x, android.R.style.Theme_DeviceDefault_Dialog_Alert);
            pd.setTitle(title);
            pd.setMessage("…");
            pd.setProgressStyle(ProgressDialog.STYLE_HORIZONTAL);
            pd.setMax(100);
            pd.setCancelable(false);
            pd.show();
        } });
        HttpURLConnection c = null;
        try {
            File tmp = new File(f.getParentFile(), f.getName() + ".dl");
            String cur = u;
            int code = 0;
            for (int hop = 0; hop < 6; hop++) {
                c = (HttpURLConnection) new URL(cur).openConnection();
                c.setInstanceFollowRedirects(false);
                c.setConnectTimeout(20000);
                c.setReadTimeout(30000);
                c.setRequestProperty("User-Agent", "ElementArenasi");
                code = c.getResponseCode();
                if (code >= 300 && code < 400) {
                    String loc = c.getHeaderField("Location");
                    c.disconnect();
                    if (loc == null) break;
                    cur = new URL(new URL(cur), loc).toString();
                    continue;
                }
                break;
            }
            if (code != 200) throw new Exception("HTTP " + code);
            final long total = c.getContentLength();
            InputStream in = c.getInputStream();
            OutputStream out = new FileOutputStream(tmp);
            byte[] b = new byte[65536];
            long got = 0, last = 0;
            int n;
            while ((n = in.read(b)) > 0) {
                out.write(b, 0, n);
                got += n;
                long now = System.currentTimeMillis();
                if (now - last > 200) {
                    last = now;
                    final long g = got;
                    ui(new Ui() { public void run(MainActivity x) {
                        if (pd == null) return;
                        if (total > 0) pd.setProgress((int) (g * 100 / total));
                        pd.setMessage(String.format(Locale.US, "%.1f / %.1f MB", g / 1048576.0, Math.max(total, g) / 1048576.0));
                    } });
                }
            }
            out.close();
            in.close();
            if (total > 0 && got != total) throw new Exception("eksik indirme");
            if (f.exists()) f.delete();
            if (!tmp.renameTo(f)) throw new Exception("dosya yazılamadı");
            return got;
        } finally {
            if (c != null) c.disconnect();
            if (title != null) ui(new Ui() { public void run(MainActivity x) { try { if (pd != null) pd.dismiss(); } catch (Exception e) { } pd = null; } });
        }
    }
}
