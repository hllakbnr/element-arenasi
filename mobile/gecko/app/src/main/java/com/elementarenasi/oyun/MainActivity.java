package com.elementarenasi.oyun;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import org.json.JSONObject;
import org.mozilla.geckoview.AllowOrDeny;
import org.mozilla.geckoview.GeckoResult;
import org.mozilla.geckoview.GeckoRuntime;
import org.mozilla.geckoview.GeckoRuntimeSettings;
import org.mozilla.geckoview.GeckoSession;
import org.mozilla.geckoview.GeckoSessionSettings;
import org.mozilla.geckoview.GeckoView;

/* Oyun, uygulamanın içine gömülü Firefox motoruyla (GeckoView) çalışır; telefonun kendi WebView'ine
   bağlı değildir. Oyun dosyaları uygulamanın içindeki küçük bir yerel sunucudan (127.0.0.1) verilir;
   oyunla Android arasındaki köprü de (güncelleme, pencereler, Google girişi dönüşü, geri tuşu) bu sunucudan geçer. */
public class MainActivity extends Activity {
    private static GeckoRuntime runtime;
    private GeckoView view;
    private GeckoSession session;
    private LocalServer server;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            WindowManager.LayoutParams lp = getWindow().getAttributes();
            lp.layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_DEFAULT;
            getWindow().setAttributes(lp);
        }
        server = LocalServer.get(this);
        if (runtime == null) {
            GeckoRuntimeSettings s = new GeckoRuntimeSettings.Builder()
                    .javaScriptEnabled(true)
                    .consoleOutput(false)
                    .remoteDebuggingEnabled(false)
                    .build();
            runtime = GeckoRuntime.create(getApplicationContext(), s);
        }
        view = new GeckoView(this);
        view.coverUntilFirstPaint(0xFF0B0A12);
        setContentView(view);
        openSession();
        immersive();
        handleIntent(getIntent());
    }

    private void openSession() {
        GeckoSessionSettings ss = new GeckoSessionSettings.Builder()
                .usePrivateMode(false)
                .useTrackingProtection(false)
                .userAgentMode(GeckoSessionSettings.USER_AGENT_MODE_MOBILE)
                .viewportMode(GeckoSessionSettings.VIEWPORT_MODE_MOBILE)
                .build();
        final GeckoSession s = new GeckoSession(ss);
        s.setNavigationDelegate(new GeckoSession.NavigationDelegate() {
            @Override
            public GeckoResult<AllowOrDeny> onLoadRequest(GeckoSession gs, GeckoSession.NavigationDelegate.LoadRequest req) {
                String u = req.uri == null ? "" : req.uri;
                if (u.startsWith(server.base()) || u.startsWith("about:") || u.startsWith("data:") || u.startsWith("blob:")) {
                    return GeckoResult.fromValue(AllowOrDeny.ALLOW);
                }
                openExternal(u); // oyunun dışındaki bağlantılar telefonun tarayıcısında açılır
                return GeckoResult.fromValue(AllowOrDeny.DENY);
            }
        });
        s.setPermissionDelegate(new GeckoSession.PermissionDelegate() {
            @Override
            public GeckoResult<Integer> onContentPermissionRequest(GeckoSession gs, GeckoSession.PermissionDelegate.ContentPermission perm) {
                int p = perm.permission;
                boolean ok = p == PERMISSION_AUTOPLAY_AUDIBLE || p == PERMISSION_AUTOPLAY_INAUDIBLE || p == PERMISSION_PERSISTENT_STORAGE;
                return GeckoResult.fromValue(ok ? ContentPermission.VALUE_ALLOW : ContentPermission.VALUE_DENY);
            }
        });
        s.setContentDelegate(new GeckoSession.ContentDelegate() {
            @Override
            public void onCrash(GeckoSession gs) { restartSession(); }
            @Override
            public void onKill(GeckoSession gs) { restartSession(); }
        });
        s.open(runtime);
        view.setSession(s);
        session = s;
        s.loadUri(server.base() + "index.html?t=" + server.token);
    }

    private void restartSession() {
        runOnUiThread(new Runnable() {
            public void run() {
                try { if (session != null) { view.releaseSession(); session.close(); } } catch (Throwable t) { }
                session = null;
                if (!isFinishing()) openSession();
            }
        });
    }

    void openExternal(String u) {
        try {
            Intent i = new Intent(Intent.ACTION_VIEW, Uri.parse(u));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            startActivity(i);
        } catch (Exception e) { }
    }

    private void handleIntent(Intent i) {
        if (i == null || i.getData() == null) return;
        String u = i.getData().toString();
        if (u.startsWith("elementarenasi://")) {
            try { server.push(new JSONObject().put("t", "url").put("url", u)); } catch (Exception e) { }
        }
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        handleIntent(intent);
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        try { server.push(new JSONObject().put("t", "back")); } catch (Exception e) { }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (session != null) session.setActive(true);
        immersive();
        try { server.push(new JSONObject().put("t", "resume")); } catch (Exception e) { }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (session != null) session.setActive(false);
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (isFinishing() && session != null) {
            try { view.releaseSession(); session.close(); } catch (Throwable t) { }
            session = null;
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) immersive();
    }

    private void immersive() {
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        WindowInsetsControllerCompat c = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        c.hide(WindowInsetsCompat.Type.systemBars());
        c.setSystemBarsBehavior(WindowInsetsControllerCompat.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
    }
}
