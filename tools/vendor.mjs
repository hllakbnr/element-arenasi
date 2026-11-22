// Oyunun internetten çektiği kütüphaneleri (three.js, Supabase) uygulamanın içine koyar ve
// Google yazı tipi bağlantısını kaldırır (yazı tipleri fonts.mjs ile zaten içeride).
// Böylece masaüstü ve telefon uygulaması açılırken hiçbir sunucuyu beklemez.
import fs from 'node:fs';
const LIBS=[
 ['three.min.js',['https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js','https://unpkg.com/three@0.149.0/build/three.min.js']],
 ['supabase.min.js',['https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js','https://unpkg.com/@supabase/supabase-js@2.49.4/dist/umd/supabase.min.js']]];
fs.mkdirSync('game/vendor',{recursive:true});
for(const [name,urls] of LIBS){let ok=false;
 for(const u of urls){for(let i=0;i<3&&!ok;i++){try{const r=await fetch(u);if(!r.ok)throw new Error(r.status);const t=await r.text();if(t.length<10000)throw new Error('kısa');fs.writeFileSync('game/vendor/'+name,t);ok=true;console.log(name,t.length,'bayt',u)}catch(e){console.log('tekrar',name,u,e.message);await new Promise(s=>setTimeout(s,2000))}}if(ok)break}
 if(!ok)throw new Error(name+' indirilemedi')}
let html=fs.readFileSync('game/index.html','utf8');const n0=html.length;
html=html.replace('https://cdn.jsdelivr.net/npm/three@0.149.0/build/three.min.js','vendor/three.min.js');
if(!html.includes('vendor/supabase.min.js'))html=html.replace('<script src="config.js"></script>','<script src="vendor/supabase.min.js"></script>\n<script src="config.js"></script>');
if(fs.existsSync('game/fonts/fonts.css'))html=html.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/g,'').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">\n?/g,'');
for(const [k,v] of [['three yerel',html.includes('src="vendor/three.min.js"')],['supabase yerel',html.includes('vendor/supabase.min.js')],['google fonts yok',!html.includes('fonts.googleapis.com/css2')]])console.log(v?'tamam':'EKSİK',k);
if(!html.includes('src="vendor/three.min.js"'))process.exit(1);
fs.writeFileSync('game/index.html',html);console.log('index.html',n0,'→',html.length);
