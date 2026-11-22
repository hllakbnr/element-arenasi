package com.elementarenasi.oyun;

import android.content.Context;
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
