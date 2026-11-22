/* Android koprusu: Google girisi (telefonun tarayicisi + elementarenasi:// geri donusu), geri tusu,
   surum, notlar ve oyun ici guncelleme (APK'yi indirir, Android kurulum ekranini acar). */
(function(){
 var C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
 function plug(n){try{if(C.Plugins&&C.Plugins[n])return C.Plugins[n];if(C.registerPlugin)return C.registerPlugin(n)}catch(e){}return null}
 var App=plug('App'),Browser=plug('Browser'),Upd=plug('EaUpdate');
 var VER='__EA_VERSION__',REPO='hllakbnr/element-arenasi',APK='https://github.com/'+REPO+'/releases/latest/download/ElementArenasi.apk',cbs=[],pend=null;
 document.documentElement.classList.add('ea-mobile');
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
  'Grafik çökmesi: '+(gl.lost||0)+' · toparlanma: '+(gl.restored||0)+' · grafik: '+G("typeof SET!=='undefined'?SET.gfx:'?'"),
  'Oyun: açıldı='+(window.__eaBooted?'evet':'HAYIR')+' · durum='+G("typeof state!=='undefined'?state:'?'")+' · giriş ekranı='+G("document.getElementById('auth')&&!document.getElementById('auth').hidden?'açık':'kapalı'"),
  'Hesap: '+G("typeof PLAT!=='undefined'?(PLAT.user?'giriş yapıldı':'giriş yok')+(PLAT.err?' (sunucu hatası)':''):'?'")+' · eklentiler: App '+(App?'var':'YOK')+', Browser '+(Browser?'var':'YOK')+', Güncelleme '+(Upd?'var':'YOK'),
  'Giriş adımları: '+(DG.auth.join(' | ')||'-'),
  'Hatalar:\n'+(DG.errs.join('\n')||'-')];return L.join('\n')}
 function showDiag(){var m=report();if(Upd&&Upd.alert)Upd.alert({title:'Element Arenası · bilgi',message:m}).catch(function(){alert(m)});else alert(m)}
 window.eaDiag={show:showDiag,lost:function(n){if(n>=2&&!DG.lostShown){DG.lostShown=1;showDiag()}},auth:function(m){dpush(DG.auth,m)}};
 addEventListener('pointerdown',function(e){if(e.clientX>90||e.clientY>90)return;var now=Date.now();DG.taps=(DG.taps||[]).filter(function(t){return now-t<3000});DG.taps.push(now);if(DG.taps.length>=5){DG.taps=[];showDiag()}},true);

 function en(){try{return JSON.parse(localStorage.getItem('ea-set')||'{}').lang==='en'}catch(e){return false}}
 function deliver(u){dpush(DG.auth,'geri dönüş '+(String(u).indexOf('code=')>0?'(kod var)':'(kod YOK: '+String(u).slice(0,60)+')')+' dinleyici '+cbs.length);if(!u||String(u).indexOf('elementarenasi://')!==0)return;try{Browser&&Browser.close()}catch(e){}if(cbs.length)cbs.forEach(function(f){try{f(u)}catch(e){}});else pend=u}
 function openExt(u){dpush(DG.auth,'tarayıcı açıldı '+String(u).split('?')[0].slice(0,60));if(Browser)return Browser.open({url:u,presentationStyle:'fullscreen'});location.href=u;return Promise.resolve()}
 window.eaDesk={version:VER,mobile:true,open:openExt,
  onAuth:function(cb){cbs.push(cb);if(pend){var u=pend;pend=null;setTimeout(function(){cb(u)},0)}},
  notes:function(){return fetch('release-notes.md').then(function(r){return r.ok?r.text():''}).catch(function(){return ''})}};
 if(App){
  App.addListener('appUrlOpen',function(e){deliver(e&&e.url)});
  if(App.getLaunchUrl)App.getLaunchUrl().then(function(r){if(r&&r.url)deliver(r.url)}).catch(function(){});
  App.addListener('backButton',function(){if(U.box)return;window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))});
 }
 /* ---- oyun ici guncelleme: PC'deki gibi, yeni surum varsa once guncellenir ---- */
 var U={box:null,state:'',tag:'',ready:false};
 function newer(a,b){a=String(a).replace(/^v/,'').split('.').map(Number);b=String(b).replace(/^v/,'').split('.').map(Number);for(var i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return false}
 function T(tr,eng){return en()?eng:tr}
 function el(tag,css,txt){var d=document.createElement(tag);if(css)d.style.cssText=css;if(txt!=null)d.textContent=txt;return d}
 function btn(txt,main){var b=el('button','font:700 17px "Barlow Condensed",Arial,sans-serif;letter-spacing:.06em;text-transform:uppercase;border-radius:6px;padding:11px 22px;'+(main?'background:#d6a24a;color:#1a1208;border:0':'background:none;color:#f1e8d6;border:1px solid rgba(214,162,74,.7)'),txt);b.type='button';return b}
 function ui(){if(U.box)return U.box;var o=el('div','position:fixed;inset:0;z-index:2147483646;display:flex;align-items:center;justify-content:center;padding:20px;background:#0b0a12;color:#f1e8d6;font:16px/1.45 "Barlow Condensed",Arial,sans-serif;text-align:center');
  var c=el('div','width:min(520px,100%);display:flex;flex-direction:column;align-items:center;gap:12px');
  U.h=el('div','font:400 30px Shojumaru,"Cinzel",serif;color:#d6a24a;letter-spacing:.04em');U.p=el('div','font-size:18px;color:#e9dcc4');
  var bar=el('div','width:100%;height:12px;border:1px solid rgba(214,162,74,.7);border-radius:6px;overflow:hidden;background:rgba(255,255,255,.05)');U.f=el('div','height:100%;width:0;background:linear-gradient(90deg,#b8822e,#f2c86a)');bar.appendChild(U.f);U.bar=bar;
  U.s=el('div','font-size:15px;color:#b9ad97;min-height:22px');U.row=el('div','display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px');
  c.appendChild(U.h);c.appendChild(U.p);c.appendChild(bar);c.appendChild(U.s);c.appendChild(U.row);o.appendChild(c);(document.body||document.documentElement).appendChild(o);U.box=o;return o}
 function buttons(list){U.row.innerHTML='';list.forEach(function(x){var b=btn(x[0],x[2]);b.onclick=x[1];U.row.appendChild(b)})}
 function mb(n){return (n/1048576).toFixed(1)+' MB'}
 function start(tag){U.tag=tag;ui();U.h.textContent=T('Güncelleme','Update');U.p.textContent=T('Yeni sürüm ','New version ')+tag+T(' indiriliyor…',' is downloading…');U.bar.style.display='';U.f.style.width='0';U.s.textContent='';buttons([]);
  if(!Upd||!Upd.download){fallback(T('Bu cihazda otomatik güncelleme yapılamıyor.','Automatic update is not available on this device.'));return}
  var h=null;try{h=Upd.addListener('progress',function(p){if(!p)return;var t=p.total||0;U.f.style.width=(t>0?Math.min(100,p.got/t*100):15)+'%';U.s.textContent=t>0?mb(p.got)+' / '+mb(t):mb(p.got)})}catch(e){}
  Upd.download({url:APK}).then(function(){try{h&&h.then?h.then(function(x){x&&x.remove&&x.remove()}):h&&h.remove&&h.remove()}catch(e){}U.f.style.width='100%';U.ready=true;install()})
   .catch(function(e){fallback(T('İndirme başarısız oldu.','The download failed.')+(e&&e.message?' ('+e.message+')':''))})}
 function install(){U.p.textContent=T('İndirme tamam. Açılan ekranda "Güncelle"ye bas.','Download complete. Tap "Update" on the screen that opens.');U.s.textContent=T('Kurulumdan sonra oyunu yeniden aç.','Open the game again after installing.');
  buttons([[T('Kur','Install'),install,true]]);
  Upd.canInstall().then(function(r){if(r&&r.ok===false){U.p.textContent=T('Güncellemeyi kurmak için bu uygulamaya izin vermen gerekiyor: açılan ekranda "Bu kaynaktan izin ver"i aç, sonra geri dön.','To install the update, allow this app: turn on "Allow from this source" on the screen that opens, then come back.');
    buttons([[T('İzin ekranını aç','Open permission screen'),function(){Upd.openSettings()},true]]);U.state='perm';return}
   return Upd.install().then(function(){U.state='installing'})}).catch(function(e){fallback(T('Kurulum açılamadı.','Could not open the installer.')+(e&&e.message?' ('+e.message+')':''))})}
 function fallback(msg){ui();U.h.textContent=T('Güncelleme','Update');U.p.textContent=msg+' '+T('Yeni sürümü tarayıcıdan indirip kurabilirsin.','You can download and install the new version from the browser.');U.bar.style.display='none';
  buttons([[T('Tarayıcıda indir','Download in browser'),function(){openExt(APK)},true],[T('Tekrar dene','Try again'),function(){start(U.tag)}],[T('Şimdilik oyna','Play for now'),close]])}
 function close(){if(U.box){U.box.remove();U.box=null}}
 function check(){if(U.box)return;fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'}}).then(function(r){return r.ok?r.json():null}).then(function(j){
  if(!j||!j.tag_name||!newer(j.tag_name,VER))return;if(!(j.assets||[]).some(function(a){return a&&a.name==='ElementArenasi.apk'}))return;
  var go=function(){start(j.tag_name)};if(document.body)go();else addEventListener('DOMContentLoaded',go)}).catch(function(){})}
 setTimeout(check,1500);
 if(App)App.addListener('resume',function(){if(U.box&&U.ready){if(U.state==='perm'||U.state==='installing')install()}else setTimeout(check,1500)});
})();
