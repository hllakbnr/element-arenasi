package com.elementarenasi.oyun;

import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Handler;
import android.os.Looper;
import android.webkit.ValueCallback;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    // Güvenli görüntü seviyesi (oyunun "ekranı görüyor musun?" sorusuyla artar):
    // 0 normal · 2+ kenardan kenara tam ekran kapalı · 3 WebView yazılımla çizilir
    static int safe(Context c) {
        return c.getSharedPreferences("ea", Context.MODE_PRIVATE).getInt("safe", 0);
    }

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EaUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        noForceDark();
        applySafe(safe(this));
    }

    /* ---- Görüntü bekçisi: sayfa açıldıktan sonra tarayıcı kare çiziyor mu? ----
       Oyun requestAnimationFrame ile sayaç tutar (window.__eaRafN). Sayaç ilerlemiyorsa ya da sayfa cevap
       vermiyorsa tarayıcı takılmıştır: bir sonraki güvenli seviyeye geçilir ve sayfa o seviyeyle yeniden açılır. */
    private final Handler wd = new Handler(Looper.getMainLooper());
    private int wdGen = 0;
    private boolean wdOk = false, resumed = false;

    @Override
    public void onResume() {
        super.onResume();
        resumed = true;
        if (!wdOk) armWatchdog(8000);
    }

    @Override
    public void onPause() {
        super.onPause();
        resumed = false;
        wdGen++; // arka plandayken kare çizilmez, ölçüm geçersiz
    }

    private void armWatchdog(long delay) {
        final int gen = ++wdGen;
        wd.postDelayed(new Runnable() { public void run() { readRaf(gen, -1, 0); } }, delay);
    }

    private void readRaf(final int gen, final long first, final int tries) {
        if (gen != wdGen || wdOk || !resumed) return;
        final WebView w = getBridge() != null ? getBridge().getWebView() : null;
        if (w == null) return;
        final boolean[] got = {false};
        try {
            w.evaluateJavascript("(window.__eaRafN||0)+''", new ValueCallback<String>() {
                public void onReceiveValue(String v) {
                    got[0] = true;
                    if (gen != wdGen || wdOk || !resumed) return;
                    long n = 0;
                    try { n = Long.parseLong(v.replace("\"", "").trim()); } catch (Exception e) { n = 0; }
                    if (first < 0) {
                        final long n0 = n;
                        wd.postDelayed(new Runnable() { public void run() { readRaf(gen, n0, tries); } }, 3000);
                    } else if (n - first >= 12) {
                        wdOk = true; // kareler akıyor
                    } else if (tries < 1) {
                        final long n1 = n;
                        wd.postDelayed(new Runnable() { public void run() { readRaf(gen, n1, tries + 1); } }, 3000);
                    } else {
                        stalled();
                    }
                }
            });
        } catch (Throwable t) { return; }
        // sayfa hiç cevap vermezse de takılmış say
        wd.postDelayed(new Runnable() { public void run() { if (!got[0] && gen == wdGen && !wdOk && resumed) { if (tries < 1) readRaf(gen, -1, tries + 1); else stalled(); } } }, 4000);
    }

    private void stalled() {
        wdGen++;
        int s = safe(this);
        if (s < 3) {
            final int n = s + 1;
            getSharedPreferences("ea", Context.MODE_PRIVATE).edit().putInt("safe", n).commit();
            applySafe(n);
            try { android.widget.Toast.makeText(this, "Görüntü sorunu algılandı, farklı ayar deneniyor (" + n + "/3)…", android.widget.Toast.LENGTH_LONG).show(); } catch (Throwable t) { }
            try {
                WebView w = getBridge().getWebView();
                String u = w.getUrl();
                if (u == null || !u.startsWith("http")) u = "https://localhost/";
                int q = u.indexOf('?'); if (q >= 0) u = u.substring(0, q);
                int h = u.indexOf('#'); if (h >= 0) u = u.substring(0, h);
                w.loadUrl(u + "?safe=" + n);
            } catch (Throwable t) { }
            armWatchdog(9000);
        } else {
            wdOk = true;
            showGiveUp();
        }
    }

    private void showGiveUp() {
        String wv = "?";
        try { if (Build.VERSION.SDK_INT >= 26) { android.content.pm.PackageInfo p = WebView.getCurrentWebViewPackage(); if (p != null) wv = p.packageName + " " + p.versionName; } } catch (Throwable t) { }
        String msg = "Bu telefonun tarayıcı bileşeni oyunu çizemiyor.\n\nÇözüm: Play Store'dan \"Android System WebView\" ve \"Chrome\" uygulamalarını güncelle, sonra oyunu yeniden aç.\n\n"
            + Build.MANUFACTURER + " " + Build.MODEL + " · Android " + Build.VERSION.RELEASE + "\nWebView: " + wv;
        try {
            new android.app.AlertDialog.Builder(this).setTitle("Element Arenası").setMessage(msg).setCancelable(true)
                .setPositiveButton("WebView'i güncelle", new android.content.DialogInterface.OnClickListener() {
                    public void onClick(android.content.DialogInterface d, int x) {
                        try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.webview"))); }
                        catch (Throwable t) { try { startActivity(new Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.webview"))); } catch (Throwable t2) { } }
                    }
                })
                .setNegativeButton("Baştan dene", new android.content.DialogInterface.OnClickListener() {
                    public void onClick(android.content.DialogInterface d, int x) {
                        getSharedPreferences("ea", Context.MODE_PRIVATE).edit().putInt("safe", 0).commit();
                        wdOk = false; applySafe(0);
                        try { WebView w = getBridge().getWebView(); w.loadUrl("https://localhost/?safe=0"); } catch (Throwable t) { }
                        armWatchdog(9000);
                    }
                }).show();
        } catch (Throwable t) { }
    }

    // Güvenli seviyeyi uygular; uygulamayı yeniden başlatmadan da çağrılabilir (eklenti → UI iş parçacığı)
    public void applySafe(int s) {
        try {
            if (s < 2) {
                if (Build.VERSION.SDK_INT >= 28) {
                    getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
                }
                immersive();
            } else {
                WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
                WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
                c.show(WindowInsetsCompat.Type.systemBars());
                if (Build.VERSION.SDK_INT >= 28) {
                    getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;
                }
            }
            WebView w = getBridge() != null ? getBridge().getWebView() : null;
            if (w != null) w.setLayerType(s >= 3 ? View.LAYER_TYPE_SOFTWARE : View.LAYER_TYPE_NONE, null);
        } catch (Throwable t) { }
    }

    // Bazı telefonlar (ör. Xiaomi) uygulamalara zorla karanlık mod uygular; WebView görüntüsünü bozabilir.
    @SuppressWarnings("deprecation")
    private void noForceDark() {
        try {
            if (Build.VERSION.SDK_INT >= 29) getWindow().getDecorView().setForceDarkAllowed(false);
            WebView w = getBridge() != null ? getBridge().getWebView() : null;
            if (w == null) return;
            if (Build.VERSION.SDK_INT >= 29) w.setForceDarkAllowed(false);
            WebSettings ws = w.getSettings();
            if (Build.VERSION.SDK_INT >= 33) ws.setAlgorithmicDarkeningAllowed(false);
            else if (Build.VERSION.SDK_INT >= 29) ws.setForceDark(WebSettings.FORCE_DARK_OFF);
        } catch (Throwable t) { }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus && safe(this) < 2) immersive();
    }

    private void immersive() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
