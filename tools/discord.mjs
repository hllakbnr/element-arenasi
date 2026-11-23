// Yeni sürüm yayınlanınca güncelleme notlarını Discord kanalına gönderir.
// Kanalların webhook adresleri GitHub'da gizli ayarlarda durur: DISCORD_WEBHOOK (ilk sunucu), DISCORD_WEBHOOK_2 (ikinci sunucu).
// Hangisi tanımlıysa ona gönderir; hiçbiri yoksa hiçbir şey yapmaz. ONLY=2 ise yalnızca ikinciye (deneme için).
import fs from 'node:fs';
const ok=h=>/^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//.test(h);
const pick=v=>String(v||'').split(/[\s,]+/).map(x=>x.trim()).filter(ok);
const hooks=[...new Set((process.env.ONLY==='2'?[]:pick(process.env.DISCORD_WEBHOOK)).concat(pick(process.env.DISCORD_WEBHOOK_2)))];
if(!hooks.length){console.log('Discord webhook yok, atlandı');process.exit(0)}
const ver=(process.env.VER||'').replace(/^v/,'')||JSON.parse(fs.readFileSync('package.json','utf8')).version;
let notes='';try{notes=fs.readFileSync('build/release-notes.md','utf8').trim()}catch(e){}
const lines=notes.split(/\r?\n/).map(l=>l.replace(/^\s*[-*]\s*/,'').trim()).filter(Boolean);
let desc=lines.map(l=>'• '+l).join('\n')||'Yeni sürüm yayında.';if(desc.length>3800)desc=desc.slice(0,3800)+'…';
const repo=process.env.GITHUB_REPOSITORY||'hllakbnr/element-arenasi';
const body={username:'Element Arenası',embeds:[{title:`Element Arenası v${ver} yayında!`,url:`https://github.com/${repo}/releases/tag/v${ver}`,description:desc+'\n\nOyunu açınca güncelleme kendiliğinden iner (bilgisayarda ve telefonda).',color:0xd6a24a,
 fields:[{name:'Windows',value:`[Kurulum dosyasını indir](https://github.com/${repo}/releases/latest/download/ElementArenasi-Kurulum.exe)`,inline:true}].concat(process.env.APK_OK==='true'?[{name:'Android',value:`[APK (64-bit)](https://github.com/${repo}/releases/latest/download/ElementArenasi.apk) · [APK (32-bit)](https://github.com/${repo}/releases/latest/download/ElementArenasi-32.apk)\nUygulama kuruluysa oyun kendini günceller.`,inline:true}]:[]),timestamp:new Date().toISOString()}],allowed_mentions:{parse:[]}};
let n=0;
for(const [k,hook] of hooks.entries()){
 for(let i=0;i<3;i++){const r=await fetch(hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
  if(r.ok){console.log('Discord '+(k+1)+': gönderildi');n++;break}
  if(r.status===429){const j=await r.json().catch(()=>({}));await new Promise(s=>setTimeout(s,((j.retry_after||2)*1000)));continue}
  console.log('Discord '+(k+1)+' hata',r.status,(await r.text()).slice(0,200));break}}
console.log(n+'/'+hooks.length+' kanala gönderildi');process.exit(0);
