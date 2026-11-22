// Yeni sürüm yayınlanınca güncelleme notlarını Discord kanalına gönderir.
// Kanalın webhook adresi GitHub'da DISCORD_WEBHOOK adlı gizli ayarda durur; yoksa hiçbir şey yapmaz.
import fs from 'node:fs';
const hook=(process.env.DISCORD_WEBHOOK||'').trim();
if(!/^https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//.test(hook)){console.log('DISCORD_WEBHOOK yok, atlandı');process.exit(0)}
const ver=JSON.parse(fs.readFileSync('package.json','utf8')).version;
let notes='';try{notes=fs.readFileSync('build/release-notes.md','utf8').trim()}catch(e){}
const lines=notes.split(/\r?\n/).map(l=>l.replace(/^\s*[-*]\s*/,'').trim()).filter(Boolean);
let desc=lines.map(l=>'• '+l).join('\n')||'Yeni sürüm yayında.';if(desc.length>3800)desc=desc.slice(0,3800)+'…';
const repo=process.env.GITHUB_REPOSITORY||'hllakbnr/element-arenasi';
const body={username:'Element Arenası',embeds:[{title:`Element Arenası v${ver} yayında!`,url:`https://github.com/${repo}/releases/tag/v${ver}`,description:desc+'\n\nBilgisayarda oyunu açınca güncelleme kendiliğinden iner. Telefonda oyunun içindeki İndir uyarısına bas.',color:0xd6a24a,
 fields:[{name:'Windows',value:`[Kurulum dosyasını indir](https://github.com/${repo}/releases/latest/download/ElementArenasi-Kurulum.exe)`,inline:true}].concat(process.env.APK_OK==='true'?[{name:'Android',value:`[APK dosyasını indir](https://github.com/${repo}/releases/latest/download/ElementArenasi.apk)`,inline:true}]:[]),timestamp:new Date().toISOString()}],allowed_mentions:{parse:[]}};
for(let i=0;i<3;i++){const r=await fetch(hook,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
 if(r.ok){console.log('Discord: gönderildi');process.exit(0)}
 if(r.status===429){const j=await r.json().catch(()=>({}));await new Promise(s=>setTimeout(s,((j.retry_after||2)*1000)));continue}
 console.log('Discord hata',r.status,(await r.text()).slice(0,200));break}
process.exit(0);
