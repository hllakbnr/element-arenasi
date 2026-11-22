/* Android köprüsü (Firefox motoru / GeckoView): Google girişi (telefonun tarayıcısı + elementarenasi:// geri dönüşü),
   geri tuşu, sürüm, notlar ve oyun içi güncelleme. Android tarafıyla uygulamanın içindeki yerel sunucu üzerinden konuşur. */
(function(){
 var TOK=null;try{var qs=new URLSearchParams(location.search);TOK=qs.get('t');if(TOK){sessionStorage.setItem('ea-tok',TOK);history.replaceState(null,'',location.pathname)}else TOK=sessionStorage.getItem('ea-tok')}catch(e){}
 if(!TOK)return;
 function N(m,a){return fetch('/__ea/'+m,{method:'POST',headers:{'x-ea':TOK,'content-type':'application/json'},body:JSON.stringify(a||{})}).then(function(r){if(!r.ok)throw new Error('köprü '+r.status);return r.json()}).then(function(j){if(j&&j.error)throw new Error(j.error);return j})}
 var Upd={download:function(a){return N('download',a)},canInstall:function(){return N('canInstall')},openSettings:function(){return N('settings')},install:function(){return N('install')},
  alert:function(a){return N('alert',a)},confirm:function(a){return N('confirm',a)},toast:function(a){return N('toast',a)}};
 var INFO={abi:''};N('info').then(function(i){INFO=i||INFO}).catch(function(){});
 var VER='__EA_VERSION__',REPO='hllakbnr/element-arenasi',cbs=[],pend=null;
 function apkName(){var b=INFO.bits||(/^armeabi/.test(INFO.abi||'')?32:64);return b===32?'ElementArenasi-32.apk':'ElementArenasi.apk'}
 function APK(){return 'https://github.com/'+REPO+'/releases/latest/download/'+apkName()}
 document.documentElement.classList.add('ea-mobile');
 var SAFE=0;window.__eaSafe=0;
 function engine(){return 'Firefox motoru '+((navigator.userAgent.match(/rv:([\d.]+)/)||[])[1]||'?')}
 /* ---- teşhis: sol üst köşeye 5 kez dokun → Android penceresinde bilgi ---- */
 var DG={errs:[],auth:[],t0:Date.now()};
 function dpush(l,m){if(l.length<10)l.push(((Date.now()-DG.t0)/1000).toFixed(1)+'s '+String(m).slice(0,180))}
 addEventListener('error',function(e){var t=e.target;dpush(DG.errs,t&&t!==window&&(t.src||t.href)?'yüklenemedi '+(t.src||t.href):(e.message||'hata')+(e.lineno?' @'+e.lineno:''))},true);
 addEventListener('unhandledrejection',function(e){var r=e.reason;dpush(DG.errs,'söz: '+(r&&r.message||r))});
 ['warn','error'].forEach(function(k){var o=console[k];console[k]=function(){try{dpush(DG.errs,k+': '+[].slice.call(arguments).map(function(x){return x&&x.message||x}).join(' '))}catch(e){}return o.apply(console,arguments)}});
 function glInfo(){try{var c=document.createElement('canvas'),g=c.getContext('webgl');if(!g)return 'WebGL YOK';var x=g.getExtension('WEBGL_debug_renderer_info');var r=(x?g.getParameter(x.UNMASKED_RENDERER_WEBGL):g.getParameter(g.RENDERER))+' · maxTex '+g.getParameter(g.MAX_TEXTURE_SIZE);var l=g.getExtension('WEBGL_lose_context');if(l)l.loseContext();return r}catch(e){return 'hata '+e.message}}
 function G(n){try{return (0,eval)(n)}catch(e){return '?'}}
 function report(){var gl=window.__eaGL||{};var L=[
  'Sürüm: '+VER+' · '+engine()+' · '+(INFO.model||'')+' Android '+(INFO.android||'?')+' · '+(INFO.abi||'?'),
  'Ekran: '+innerWidth+'×'+innerHeight+' · dpr '+devicePixelRatio+' · '+(matchMedia('(orientation:portrait)').matches?'dikey':'yatay'),
  'GPU: '+glInfo(),
  'Grafik çökmesi: '+(gl.lost||0)+' · toparlanma: '+(gl.restored||0)+' · grafik: '+G("typeof SET!=='undefined'?SET.gfx:'?'"),
  'Oyun: açıldı='+(window.__eaBooted?'evet':'HAYIR')+' · durum='+G("typeof state!=='undefined'?state:'?'")+' · giriş ekranı='+G("document.getElementById('auth')&&!document.getElementById('auth').hidden?'açık':'kapalı'"),
  'Hesap: '+G("typeof PLAT!=='undefined'?(PLAT.user?'giriş yapıldı':'giriş yok')+(PLAT.err?' (sunucu hatası)':''):'?'")+' · köprü: var',
  'Giriş adımları: '+(DG.auth.join(' | ')||'-'),
  'Hatalar:\n'+(DG.errs.join('\n')||'-')];return L.join('\n')}
 function brief(){var gl=window.__eaGL||{},vv=window.visualViewport;return 'v'+VER+' · '+innerWidth+'×'+innerHeight+' dpr '+devicePixelRatio+(vv&&vv.scale!==1?' zoom '+vv.scale.toFixed(2):'')+' · ekran '+screen.width+'×'+screen.height+'\n'+engine()+' · '+glInfo()+'\nçökme '+(gl.lost||0)+' · açıldı '+(window.__eaBooted?'evet':'HAYIR')+(DG.errs.length?' · hata: '+DG.errs[0]:'')}
 function showDiag(){var m=report();if(Upd&&Upd.alert)Upd.alert({title:'Element Arenası · bilgi',message:m}).catch(function(){alert(m)});else alert(m)}
 window.eaDiag={show:showDiag,lost:function(n){if(n>=2&&!DG.lostShown){DG.lostShown=1;showDiag()}},auth:function(m){dpush(DG.auth,m)}};
 addEventListener('pointerdown',function(e){if(e.clientX>90||e.clientY>90)return;var now=Date.now();DG.taps=(DG.taps||[]).filter(function(t){return now-t<3000});DG.taps.push(now);if(DG.taps.length>=5){DG.taps=[];showDiag()}},true);

 function en(){try{return JSON.parse(localStorage.getItem('ea-set')||'{}').lang==='en'}catch(e){return false}}
 function T(tr,eng){return en()?eng:tr}
 function deliver(u){dpush(DG.auth,'geri dönüş '+(String(u).indexOf('code=')>0?'(kod var)':'(kod YOK: '+String(u).slice(0,60)+')')+' dinleyici '+cbs.length);if(!u||String(u).indexOf('elementarenasi://')!==0)return;if(cbs.length)cbs.forEach(function(f){try{f(u)}catch(e){}});else pend=u}
 function openExt(u){dpush(DG.auth,'tarayıcı açıldı '+String(u).split('?')[0].slice(0,60));return N('open',{url:u}).catch(function(){location.href=u})}
 window.eaDesk={version:VER,mobile:true,open:openExt,
  onAuth:function(cb){cbs.push(cb);if(pend){var u=pend;pend=null;setTimeout(function(){cb(u)},0)}},
  notes:function(){return fetch('release-notes.md').then(function(r){return r.ok?r.text():''}).catch(function(){return ''})}};
 var busy=false; // Android penceresi açıkken geri tuşu oyuna gitmesin
 function onEv(e){if(!e)return;if(e.t==='url')deliver(e.url);else if(e.t==='back'){if(!busy)window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))}else if(e.t==='resume')onResume()}
 (function poll(){N('events').then(function(j){(j.ev||[]).forEach(onEv);poll()},function(){setTimeout(poll,1500)})})();
 /* Android penceresiyle soru (oyun ekranı çizilemese bile görünür) */
 function ask(title,msg,ok,no){busy=true;return Upd.confirm({title:title,message:msg,ok:ok,cancel:no}).then(function(r){busy=false;return !!(r&&r.ok)},function(){busy=false;return false})}
 function toast(t){try{Upd&&Upd.toast&&Upd.toast({text:t})}catch(e){}}

 /* ---- 2) oyun içi güncelleme: Android penceresiyle sorar, indirir, kurulum ekranını açar ---- */
 var U={tag:'',ready:false,state:'',run:false};
 function newer(a,b){a=String(a).replace(/^v/,'').split('.').map(Number);b=String(b).replace(/^v/,'').split('.').map(Number);for(var i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return false}
 function fallback(msg){return ask(T('Güncelleme','Update'),msg+'\n\n'+T('Yeni sürümü tarayıcıdan indirip kurabilirsin.','You can download and install the new version in the browser.'),T('Tarayıcıda indir','Download in browser'),T('Şimdi değil','Not now')).then(function(ok){if(ok)openExt(APK())})}
 function install(){return Upd.canInstall().then(function(r){
   if(r&&r.ok===false){U.state='perm';return ask(T('Kurulum izni','Install permission'),T('Güncellemeyi kurabilmek için Element Arenası\'na izin vermen gerekiyor. Açılan ekranda "Bu kaynaktan izin ver"i aç, sonra oyuna geri dön.','To install the update, allow Element Arenası: turn on "Allow from this source" on the next screen, then come back.'),T('İzin ekranını aç','Open settings'),T('Vazgeç','Cancel')).then(function(ok){if(ok)Upd.openSettings();else U.state=''})}
   U.state='installing';toast(T('Açılan ekranda "Güncelle"ye bas. Sonra oyunu yeniden aç.','Tap "Update" on the next screen, then reopen the game.'));return Upd.install()})
  .catch(function(e){U.state='';return fallback(T('Kurulum ekranı açılamadı.','Could not open the installer.')+(e&&e.message?' ('+e.message+')':''))})}
 function update(tag){if(U.run)return Promise.resolve();U.run=true;U.tag=tag;
  return ask(T('Güncelleme var','Update available'),T('Yeni sürüm '+tag+' çıktı (sende '+VER+' var). Şimdi güncellensin mi?','Version '+tag+' is out (you have '+VER+'). Update now?'),T('Güncelle','Update'),T('Sonra','Later')).then(function(ok){
   if(!ok){U.run=false;return}
   if(!Upd||!Upd.download){U.run=false;return fallback(T('Bu cihazda otomatik güncelleme yapılamıyor.','Automatic update is not available on this device.'))}
   return Upd.download({url:APK(),title:T('Güncelleme indiriliyor','Downloading update')}).then(function(){U.ready=true;return install()},function(e){return fallback(T('İndirme başarısız oldu','The download failed')+(e&&e.message?' ('+e.message+')':'')+'.')}).then(function(){U.run=false})})}
 /* güncelleme: önce oyun paketi (küçük, kurulum gerekmez); Android tarafı değiştiyse APK */
 var W={tag:'',busy:false,ready:''};
 function idle(){try{return (0,eval)("typeof state!=='undefined'&&state==='menu'&&!(typeof MP!=='undefined'&&MP.room)")}catch(e){return false}}
 function applyWeb(tag){W.ready=tag;try{if(sessionStorage.getItem('ea-applied')===tag)return;sessionStorage.setItem('ea-applied',tag)}catch(e){}(function wait(){if(!idle()){setTimeout(wait,2000);return}
  N('webApply',{tag:tag}).then(function(r){if(!r||!r.ok)return;toast(T('Oyun güncellendi: ','Game updated: ')+tag);setTimeout(function(){location.reload()},500)}).catch(function(){})})()}
 function webUpd(j,tag){var a=(j.assets||[]).filter(function(x){return x&&x.name==='ElementArenasi-web.zip'})[0];if(!a)return Promise.reject(new Error('paket yok'));
  return N('webUpdate',{url:a.browser_download_url,tag:tag,sha:String(a.digest||'').replace(/^sha256:/,'')}).then(function(r){if(r&&r.ok){applyWeb(tag);return}if(r&&r.error==='apk')throw new Error('apk');if(r&&(r.error==='eski'||r.error==='bozuk'))return;throw new Error(r&&r.error||'paket')})}
 function check(){if(W.busy||W.ready||U.run)return Promise.resolve();W.busy=true;return fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'}}).then(function(r){return r.ok?r.json():null}).then(function(j){
  if(!j||!j.tag_name||!newer(j.tag_name,VER))return;var tag=j.tag_name,hasApk=(j.assets||[]).some(function(a){return a&&a.name===apkName()});
  return webUpd(j,tag).catch(function(e){if(hasApk)return update(tag)})}).catch(function(){}).then(function(){W.busy=false})}
 setTimeout(check,6000);
 /* yeni oyun paketi düzgün açıldıysa Android tarafına bildir (açılmazsa bir sonraki açılışta eski sürüme dönülür) */
 (function bt(){if(window.__eaBooted){N('booted',{v:VER}).catch(function(){});return}setTimeout(bt,700)})();
 function onResume(){if(U.ready&&(U.state==='perm'||U.state==='installing'))install();else if(!U.run)setTimeout(check,2000)}
})();
