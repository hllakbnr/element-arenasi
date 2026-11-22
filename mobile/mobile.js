/* Android koprusu: Google girisi (telefonun tarayicisi + elementarenasi:// geri donusu), geri tusu,
   surum, notlar ve oyun ici guncelleme (APK'yi indirir, Android kurulum ekranini acar). */
(function(){
 var C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
 function plug(n){try{if(C.Plugins&&C.Plugins[n])return C.Plugins[n];if(C.registerPlugin)return C.registerPlugin(n)}catch(e){}return null}
 var App=plug('App'),Browser=plug('Browser'),Upd=plug('EaUpdate');
 var VER='__EA_VERSION__',REPO='hllakbnr/element-arenasi',APK='https://github.com/'+REPO+'/releases/latest/download/ElementArenasi.apk',cbs=[],pend=null;
 document.documentElement.classList.add('ea-mobile');
 /* güvenli görüntü seviyesi: "oyunu görüyor musun?" sorusuna Hayır denince artar (oyun bunu okuyup daha sade çizer) */
 /* Android bekçisi sayfayı ?safe=N ile açarsa o seviyeyi benimse */
 try{var qs=new URLSearchParams(location.search);if(qs.has('safe')){localStorage.setItem('ea-safe',String(Math.max(0,Math.min(3,parseInt(qs.get('safe'),10)||0))));history.replaceState(null,'',location.pathname)}}catch(e){}
 var SAFE=0;try{SAFE=Math.max(0,Math.min(3,parseInt(localStorage.getItem('ea-safe')||'0',10)||0))}catch(e){}
 /* kare sayacı: Android bekçisi bununla tarayıcının çizip çizmediğini ölçer */
 window.__eaRafN=0;(function f(){window.__eaRafN++;requestAnimationFrame(f)})();
 window.__eaSafe=SAFE;if(SAFE)document.documentElement.classList.add('ea-safe');
 /* ---- teşhis: sol üst köşeye 5 kez dokun → Android penceresinde bilgi ---- */
 var DG={errs:[],auth:[],t0:Date.now()};
 function dpush(l,m){if(l.length<10)l.push(((Date.now()-DG.t0)/1000).toFixed(1)+'s '+String(m).slice(0,180))}
 addEventListener('error',function(e){var t=e.target;dpush(DG.errs,t&&t!==window&&(t.src||t.href)?'yüklenemedi '+(t.src||t.href):(e.message||'hata')+(e.lineno?' @'+e.lineno:''))},true);
 addEventListener('unhandledrejection',function(e){var r=e.reason;dpush(DG.errs,'söz: '+(r&&r.message||r))});
 ['warn','error'].forEach(function(k){var o=console[k];console[k]=function(){try{dpush(DG.errs,k+': '+[].slice.call(arguments).map(function(x){return x&&x.message||x}).join(' '))}catch(e){}return o.apply(console,arguments)}});
 function glInfo(){try{var c=document.createElement('canvas'),g=c.getContext('webgl');if(!g)return 'WebGL YOK';var x=g.getExtension('WEBGL_debug_renderer_info');var r=(x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER))+' · maxTex '+g.getParameter(g.MAX_TEXTURE_SIZE);var l=g.getExtension('WEBGL_lose_context');if(l)l.loseContext();return r}catch(e){return 'hata '+e.message}}
 function G(n){try{return (0,eval)(n)}catch(e){return '?'}}
 function report(){var gl=window.__eaGL||{};var L=[
  'Sürüm: '+VER+' · Android WebView '+((navigator.userAgent.match(/Chrome\/([\d.]+)/)||[])[1]||'?'),
  'Ekran: '+innerWidth+'×'+innerHeight+' · dpr '+devicePixelRatio+' · '+(matchMedia('(orientation:portrait)').matches?'dikey':'yatay'),
  'GPU: '+glInfo(),
  'Görüntü modu: '+SAFE+'/3 · grafik çökmesi: '+(gl.lost||0)+' · toparlanma: '+(gl.restored||0)+' · grafik: '+G("typeof SET!=='undefined'?SET.gfx:'?'"),
  'Oyun: açıldı='+(window.__eaBooted?'evet':'HAYIR')+' · durum='+G("typeof state!=='undefined'?state:'?'")+' · giriş ekranı='+G("document.getElementById('auth')&&!document.getElementById('auth').hidden?'açık':'kapalı'"),
  'Hesap: '+G("typeof PLAT!=='undefined'?(PLAT.user?'giriş yapıldı':'giriş yok')+(PLAT.err?' (sunucu hatası)':''):'?'")+' · eklentiler: App '+(App?'var':'YOK')+', Browser '+(Browser?'var':'YOK')+', Güncelleme '+(Upd?'var':'YOK'),
  'Giriş adımları: '+(DG.auth.join(' | ')||'-'),
  'Hatalar:\n'+(DG.errs.join('\n')||'-')];return L.join('\n')}
 function brief(){var gl=window.__eaGL||{},vv=window.visualViewport;return 'v'+VER+' · mod '+SAFE+'/3 · '+innerWidth+'×'+innerHeight+' dpr '+devicePixelRatio+(vv&&vv.scale!==1?' zoom '+vv.scale.toFixed(2):'')+' · ekran '+screen.width+'×'+screen.height+'\nWebView '+((navigator.userAgent.match(/Chrome\/([\d.]+)/)||[])[1]||'?')+' · '+glInfo()+'\nçökme '+(gl.lost||0)+' · açıldı '+(window.__eaBooted?'evet':'HAYIR')+(DG.errs.length?' · hata: '+DG.errs[0]:'')}
 function showDiag(){var m=report();if(Upd&&Upd.alert)Upd.alert({title:'Element Arenası · bilgi',message:m}).catch(function(){alert(m)});else alert(m)}
 window.eaDiag={show:showDiag,lost:function(n){if(n>=2&&!DG.lostShown){DG.lostShown=1;showDiag()}},auth:function(m){dpush(DG.auth,m)}};
 addEventListener('pointerdown',function(e){if(e.clientX>90||e.clientY>90)return;var now=Date.now();DG.taps=(DG.taps||[]).filter(function(t){return now-t<3000});DG.taps.push(now);if(DG.taps.length>=5){DG.taps=[];showDiag()}},true);

 function en(){try{return JSON.parse(localStorage.getItem('ea-set')||'{}').lang==='en'}catch(e){return false}}
 function T(tr,eng){return en()?eng:tr}
 function deliver(u){dpush(DG.auth,'geri dönüş '+(String(u).indexOf('code=')>0?'(kod var)':'(kod YOK: '+String(u).slice(0,60)+')')+' dinleyici '+cbs.length);if(!u||String(u).indexOf('elementarenasi://')!==0)return;try{Browser&&Browser.close()}catch(e){}if(cbs.length)cbs.forEach(function(f){try{f(u)}catch(e){}});else pend=u}
 function openExt(u){dpush(DG.auth,'tarayıcı açıldı '+String(u).split('?')[0].slice(0,60));if(Browser)return Browser.open({url:u,presentationStyle:'fullscreen'});location.href=u;return Promise.resolve()}
 window.eaDesk={version:VER,mobile:true,open:openExt,
  onAuth:function(cb){cbs.push(cb);if(pend){var u=pend;pend=null;setTimeout(function(){cb(u)},0)}},
  notes:function(){return fetch('release-notes.md').then(function(r){return r.ok?r.text():''}).catch(function(){return ''})}};
 var busy=false; // Android penceresi açıkken geri tuşu oyuna gitmesin
 if(App){
  App.addListener('appUrlOpen',function(e){deliver(e&&e.url)});
  if(App.getLaunchUrl)App.getLaunchUrl().then(function(r){if(r&&r.url)deliver(r.url)}).catch(function(){});
  App.addListener('backButton',function(){if(busy)return;window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))});
 }
 /* Android penceresiyle soru (oyun ekranı çizilemese bile görünür) */
 function ask(title,msg,ok,no){if(!Upd||!Upd.confirm)return Promise.resolve(window.confirm(msg));busy=true;return Upd.confirm({title:title,message:msg,ok:ok,cancel:no}).then(function(r){busy=false;return !!(r&&r.ok)},function(){busy=false;return false})}
 function toast(t){try{Upd&&Upd.toast&&Upd.toast({text:t})}catch(e){}}

 /* ---- 1) görüntü kontrolü: ilk açılışta (ve her mod değişiminde) bir kez sorar ---- */
 function visOk(){try{return localStorage.getItem('ea-vis')===String(SAFE)}catch(e){return true}}
 function setSafe(n){try{localStorage.setItem('ea-safe',String(n))}catch(e){}return Upd&&Upd.setSafe?Upd.setSafe({level:n}).catch(function(){}):Promise.resolve()}
 function visCheck(){if(visOk())return Promise.resolve();
  return ask('Element Arenası',T('Oyun ekranda düzgün görünüyor mu? (menü, yazılar, düğmeler)','Can you see the game properly on the screen? (menu, text, buttons)')+'\n\n'+brief(),T('Evet, görünüyor','Yes, I can see it'),T('Hayır, ekran karanlık','No, the screen is dark')).then(function(yes){
   if(yes){try{localStorage.setItem('ea-vis',String(SAFE))}catch(e){}return}
   if(SAFE<3){var n=SAFE+1;return setSafe(n).then(function(){toast(T('Farklı bir görüntü ayarı deneniyor ('+n+'/3)…','Trying another display setting ('+n+'/3)…'));setTimeout(function(){location.reload()},600)})}
   return ask(T('Ekran hâlâ karanlık','Screen still dark'),T('Bütün görüntü ayarları denendi. Bir sonraki pencerenin ekran görüntüsünü alıp gönder.\n\n','All display settings were tried. Take a screenshot of the next window and send it.\n\n')+report(),T('Tamam','OK'),T('Baştan dene','Start over')).then(function(ok){if(!ok)return setSafe(0).then(function(){try{localStorage.removeItem('ea-vis')}catch(e){}setTimeout(function(){location.reload()},600)})})})}

 /* ---- 2) oyun içi güncelleme: Android penceresiyle sorar, indirir, kurulum ekranını açar ---- */
 var U={tag:'',ready:false,state:'',run:false};
 function newer(a,b){a=String(a).replace(/^v/,'').split('.').map(Number);b=String(b).replace(/^v/,'').split('.').map(Number);for(var i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return false}
 function fallback(msg){return ask(T('Güncelleme','Update'),msg+'\n\n'+T('Yeni sürümü tarayıcıdan indirip kurabilirsin.','You can download and install the new version in the browser.'),T('Tarayıcıda indir','Download in browser'),T('Şimdi değil','Not now')).then(function(ok){if(ok)openExt(APK)})}
 function install(){return Upd.canInstall().then(function(r){
   if(r&&r.ok===false){U.state='perm';return ask(T('Kurulum izni','Install permission'),T('Güncellemeyi kurabilmek için Element Arenası\'na izin vermen gerekiyor. Açılan ekranda "Bu kaynaktan izin ver"i aç, sonra oyuna geri dön.','To install the update, allow Element Arenası: turn on "Allow from this source" on the next screen, then come back.'),T('İzin ekranını aç','Open settings'),T('Vazgeç','Cancel')).then(function(ok){if(ok)Upd.openSettings();else U.state=''})}
   U.state='installing';toast(T('Açılan ekranda "Güncelle"ye bas. Sonra oyunu yeniden aç.','Tap "Update" on the next screen, then reopen the game.'));return Upd.install()})
  .catch(function(e){U.state='';return fallback(T('Kurulum ekranı açılamadı.','Could not open the installer.')+(e&&e.message?' ('+e.message+')':''))})}
 function update(tag){if(U.run)return Promise.resolve();U.run=true;U.tag=tag;
  return ask(T('Güncelleme var','Update available'),T('Yeni sürüm '+tag+' çıktı (sende '+VER+' var). Şimdi güncellensin mi?','Version '+tag+' is out (you have '+VER+'). Update now?'),T('Güncelle','Update'),T('Sonra','Later')).then(function(ok){
   if(!ok){U.run=false;return}
   if(!Upd||!Upd.download){U.run=false;return fallback(T('Bu cihazda otomatik güncelleme yapılamıyor.','Automatic update is not available on this device.'))}
   return Upd.download({url:APK,title:T('Güncelleme indiriliyor','Downloading update')}).then(function(){U.ready=true;return install()},function(e){return fallback(T('İndirme başarısız oldu','The download failed')+(e&&e.message?' ('+e.message+')':'')+'.')}).then(function(){U.run=false})})}
 function check(){return fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'}}).then(function(r){return r.ok?r.json():null}).then(function(j){
  if(!j||!j.tag_name||!newer(j.tag_name,VER))return;if(!(j.assets||[]).some(function(a){return a&&a.name==='ElementArenasi.apk'}))return;return update(j.tag_name)}).catch(function(){})}

 /* sıra: önce görüntü kontrolü, sonra güncelleme */
 setTimeout(function(){visCheck().then(check)},14000);
 if(App)App.addListener('resume',function(){if(U.ready&&(U.state==='perm'||U.state==='installing'))install();else if(!U.run)setTimeout(check,2000)});
})();
