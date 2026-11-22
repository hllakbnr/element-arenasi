// "npx cap add android" ile oluşan projeyi oyuna göre ayarlar:
// yatay ekran, tam ekran, ekran kapanmasın, elementarenasi:// girişi, ikonlar, sürüm numarası ve imza.
import fs from 'node:fs';import path from 'node:path';
const [ver,code]=[process.argv[2],process.argv[3]];if(!ver||!code)throw new Error('sürüm yok');
const A='android/app/src/main/';
// 1) Manifest
let m=fs.readFileSync(A+'AndroidManifest.xml','utf8');
if(!m.includes('screenOrientation'))m=m.replace(/<activity\b/,'<activity\n            android:screenOrientation="sensorLandscape"\n            android:resizeableActivity="false"');
if(!m.includes('android:scheme="elementarenasi"'))m=m.replace(/(<\/intent-filter>)/,'$1\n            <intent-filter>\n                <action android:name="android.intent.action.VIEW" />\n                <category android:name="android.intent.category.DEFAULT" />\n                <category android:name="android.intent.category.BROWSABLE" />\n                <data android:scheme="elementarenasi" />\n            </intent-filter>');
if(!/android:launchMode="singleTask"/.test(m))m=m.replace(/<activity\b/,'<activity\n            android:launchMode="singleTask"');
if(!m.includes('REQUEST_INSTALL_PACKAGES'))m=m.replace('</manifest>','    <uses-permission android:name="android.permission.REQUEST_INSTALL_PACKAGES" />\n</manifest>');
fs.writeFileSync(A+'AndroidManifest.xml',m);
// 2) MainActivity: tam ekran + ekran açık kalsın
const pkgDir=A+'java/com/elementarenasi/oyun/';fs.mkdirSync(pkgDir,{recursive:true});
fs.writeFileSync(pkgDir+'MainActivity.java',`package com.elementarenasi.oyun;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(EaUpdatePlugin.class);
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P) {
            getWindow().getAttributes().layoutInDisplayCutoutMode = WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }
        immersive();
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
`);
// oyun içi güncelleme eklentisi + indirilen APK için dosya paylaşım yolu
fs.copyFileSync('EaUpdatePlugin.java',pkgDir+'EaUpdatePlugin.java');
fs.mkdirSync(A+'res/xml',{recursive:true});fs.writeFileSync(A+'res/xml/file_paths.xml','<?xml version="1.0" encoding="utf-8"?>\n<paths xmlns:android="http://schemas.android.com/apk/res/android">\n    <external-path name="my_images" path="." />\n    <cache-path name="my_cache_images" path="." />\n</paths>\n');
if(!m.includes('androidx.core.content.FileProvider')){m=m.replace('</application>','    <provider android:name="androidx.core.content.FileProvider" android:authorities="${applicationId}.fileprovider" android:exported="false" android:grantUriPermissions="true">\n            <meta-data android:name="android.support.FILE_PROVIDER_PATHS" android:resource="@xml/file_paths" />\n        </provider>\n    </application>');fs.writeFileSync(A+'AndroidManifest.xml',m)}
// 3) İkonlar
const R=A+'res/';for(const d of fs.readdirSync('res')){fs.mkdirSync(R+d,{recursive:true});for(const f of fs.readdirSync('res/'+d))fs.copyFileSync(path.join('res',d,f),path.join(R,d,f))}
fs.mkdirSync(R+'values',{recursive:true});fs.writeFileSync(R+'values/ic_launcher_background.xml','<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0E1020</color>\n</resources>\n');
// 4) Sürüm + imza
let g=fs.readFileSync('android/app/build.gradle','utf8');
g=g.replace(/versionCode\s+\d+/,'versionCode '+code).replace(/versionName\s+"[^"]*"/,'versionName "'+ver+'"');
if(!g.includes('signingConfigs')){
 g=g.replace(/(\n\s*buildTypes\s*\{)/,`
    signingConfigs {
        release {
            storeFile file(System.getenv("EA_KS") ?: "ea.jks")
            storePassword System.getenv("EA_KS_PASS")
            keyAlias System.getenv("EA_KS_ALIAS") ?: "ea"
            keyPassword System.getenv("EA_KS_PASS")
        }
    }$1`);
 g=g.replace(/(buildTypes\s*\{\s*release\s*\{)/,'$1\n            signingConfig signingConfigs.release');
}
fs.writeFileSync('android/app/build.gradle',g);
for(const [k,ok] of [['screenOrientation',m.includes('screenOrientation')],['scheme',m.includes('elementarenasi')],['signing',g.includes('signingConfig signingConfigs.release')],['versionCode '+code,g.includes('versionCode '+code)]])console.log(ok?'tamam':'EKSİK',k);
if(!g.includes('signingConfig signingConfigs.release'))process.exit(1);
