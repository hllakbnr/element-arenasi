/* Android köprüsü: Google girişi (telefonun tarayıcısı + elementarenasi:// geri dönüşü), geri tuşu, sürüm, notlar ve güncelleme uyarısı. */
(function(){
 var C=window.Capacitor;if(!C||!C.isNativePlatform||!C.isNativePlatform())return;
 var P=C.Plugins||{},VER='__EA_VERSION__',REPO='hllakbnr/element-arenasi',cbs=[],pend=null;
 document.documentElement.classList.add('ea-mobile');
 function deliver(u){if(!u||String(u).indexOf('elementarenasi://')!==0)return;try{P.Browser&&P.Browser.close()}catch(e){}if(cbs.length)cbs.forEach(function(f){try{f(u)}catch(e){}});else pend=u}
 window.eaDesk={version:VER,mobile:true,
  open:function(u){if(P.Browser)return P.Browser.open({url:u,presentationStyle:'fullscreen'});location.href=u;return Promise.resolve()},
  onAuth:function(cb){cbs.push(cb);if(pend){var u=pend;pend=null;setTimeout(function(){cb(u)},0)}},
  notes:function(){return fetch('release-notes.md').then(function(r){return r.ok?r.text():''}).catch(function(){return ''})}};
 if(P.App){
  P.App.addListener('appUrlOpen',function(e){deliver(e&&e.url)});
  if(P.App.getLaunchUrl)P.App.getLaunchUrl().then(function(r){if(r&&r.url)deliver(r.url)}).catch(function(){});
  // geri tuşu: oyundaki Esc ile aynı (duraklat / paneli kapat)
  P.App.addListener('backButton',function(){window.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',code:'Escape',bubbles:true}))});
 }
 // yeni sürüm uyarısı
 function newer(a,b){a=String(a).replace(/^v/,'').split('.').map(Number);b=String(b).replace(/^v/,'').split('.').map(Number);for(var i=0;i<3;i++){if((a[i]||0)>(b[i]||0))return true;if((a[i]||0)<(b[i]||0))return false}return false}
 function toast(tag){if(document.getElementById('eaUpd'))return;var en=false;try{en=JSON.parse(localStorage.getItem('ea-set')||'{}').lang==='en'}catch(e){}
  var d=document.createElement('div');d.id='eaUpd';d.setAttribute('role','status');
  d.style.cssText='position:fixed;left:50%;top:max(10px,env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:100000;display:flex;align-items:center;gap:12px;padding:9px 10px 9px 16px;background:rgba(12,10,20,.95);border:1px solid #d6a24a;border-radius:8px;color:#f1e8d6;font:600 15px "Barlow Condensed",Arial,sans-serif;letter-spacing:.03em;box-shadow:0 8px 24px rgba(0,0,0,.5);max-width:calc(100% - 32px)';
  var t=document.createElement('span');t.textContent=(en?'New version ':'Yeni s\u00fcr\u00fcm ')+tag+(en?' is out':' \u00e7\u0131kt\u0131');
  var b=document.createElement('button');b.type='button';b.textContent=en?'Download':'\u0130ndir';b.style.cssText='font:700 15px "Barlow Condensed",Arial,sans-serif;letter-spacing:.05em;text-transform:uppercase;background:#d6a24a;color:#1a1208;border:0;border-radius:5px;padding:8px 14px';
  b.onclick=function(){var u='https://github.com/'+REPO+'/releases/latest/download/ElementArenasi.apk';if(P.Browser)P.Browser.open({url:u});else location.href=u};
  var x=document.createElement('button');x.type='button';x.setAttribute('aria-label',en?'Close':'Kapat');x.textContent='\u2715';x.style.cssText='background:none;border:0;color:#b9ad97;font-size:16px;padding:6px 8px';x.onclick=function(){d.remove()};
  d.appendChild(t);d.appendChild(b);d.appendChild(x);document.body.appendChild(d)}
 function check(){fetch('https://api.github.com/repos/'+REPO+'/releases/latest',{headers:{Accept:'application/vnd.github+json'}}).then(function(r){return r.ok?r.json():null}).then(function(j){
  if(!j||!j.tag_name||!newer(j.tag_name,VER))return;if(!(j.assets||[]).some(function(a){return a&&a.name==='ElementArenasi.apk'}))return;
  if(document.body)toast(j.tag_name);else addEventListener('DOMContentLoaded',function(){toast(j.tag_name)})}).catch(function(){})}
 setTimeout(check,4000);
 if(P.App)P.App.addListener('resume',function(){setTimeout(check,1500)});
})();
