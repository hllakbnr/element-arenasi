// Ortak test düzeni: oyun (game/) gerçek dosyalarıyla açılır; Supabase sahte (sayfalar arası mesajlar Node üzerinden).
// Chromium = bilgisayar (Electron), Firefox = telefon uygulaması (aynı Gecko motoru).
import {chromium,firefox} from 'playwright';import fs from 'node:fs';import path from 'node:path';
const ROOT=path.resolve(path.dirname(new URL(import.meta.url).pathname),'..'),GAME=ROOT+'/game/',MOCK=fs.readFileSync(ROOT+'/tests/mock-supabase.js','utf8');
export const errs=[];const subs={},pres={},browsers={};
const bcast=(name,ev,payload,exceptKey)=>{(subs[name]||[]).forEach(([p,k])=>{if(k!==exceptKey)p.evaluate(([n,e,pl])=>window.__sbRecv&&window.__sbRecv(n,e,pl),[name,ev,payload]).catch(()=>{})})};
export async function browser(kind){if(process.env.NOFF&&kind==='firefox')kind='chromium';if(!browsers[kind])browsers[kind]=await (kind==='firefox'?firefox:chromium).launch(kind==='firefox'?{firefoxUserPrefs:{'webgl.force-enabled':true,'webgl.disabled':false,'media.peerconnection.ice.loopback':true}}:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});return browsers[kind]}
export async function closeAll(){for(const b of Object.values(browsers))await b.close().catch(()=>{})}
// kind: chromium|firefox · phone: ea-mobile (uygulama) + dokunmatik + yatay telefon ekranı
export async function openGame({kind='chromium',phone=false,user=null,save=null,tag='?'}={}){
 const b=await browser(kind);const opt=phone?{viewport:{width:873,height:393},hasTouch:true}:{viewport:{width:1280,height:720}};if(phone&&kind==='chromium')Object.assign(opt,{isMobile:true,deviceScaleFactor:2});
 const ctx=await b.newContext(opt);
 await ctx.exposeBinding('__sbJoin',(src,name,key)=>{(subs[name]=subs[name]||[]).push([src.page,key]);if(pres[name])src.page.evaluate(([n,pl])=>window.__sbRecv(n,'presence',pl),[name,pres[name]]).catch(()=>{})});
 await ctx.exposeBinding('__sbSend',(src,name,key,ev,payload)=>bcast(name,ev,payload,key));
 await ctx.exposeBinding('__sbTrack',(src,name,key,p)=>{const st=pres[name]=pres[name]||{};if(p)st[key]=[p];else delete st[key];(subs[name]||[]).forEach(([pg])=>pg.evaluate(([n,pl])=>window.__sbRecv(n,'presence',pl),[name,st]).catch(()=>{}))});
 await ctx.addInitScript(([u,sv])=>{if(u)localStorage.setItem('mockUser',JSON.stringify(u));localStorage.setItem('ea-save',JSON.stringify(sv))},[user,save||{coins:0,up:{zirh:0,silah:0,odak:0},setup:true,guide:1,mode:'c',cust2:{el:'fire',wpn:'katana'},st:{games:2}}]);
 await ctx.addInitScript(MOCK);
 await ctx.route('**/*',r=>{const u=r.request().url();if(process.env.THREE&&/three(\.min)?\.js/.test(u))return r.fulfill({body:fs.readFileSync(process.env.THREE,'utf8'),contentType:'text/javascript'});const m=u.match(/^http:\/\/game\.test\/(.*?)(\?.*)?$/);if(!m)return r.abort();const f=m[1]||'index.html';
  if(f==='config.js'||f.includes('supabase'))return r.fulfill({body:'',contentType:'text/javascript'});
  let body;try{body=fs.readFileSync(GAME+f)}catch(e){return r.fulfill({status:404,body:''})}
  if(f==='index.html'&&phone)body=Buffer.from('<script>document.documentElement.classList.add("ea-mobile")</script>'+body.toString('utf8'));
  return r.fulfill({body,contentType:f.endsWith('.js')?'text/javascript':f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream'})});
 const p=await ctx.newPage();p.on('pageerror',e=>errs.push(tag+' '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|favicon/.test(m.text()))errs.push(tag+' c:'+m.text().slice(0,200))});
 await p.goto('http://game.test/',{timeout:120000,waitUntil:'domcontentloaded'});await p.waitForFunction(()=>window.__eaBooted===1,null,{timeout:60000}).catch(()=>errs.push(tag+' açılmadı'));
 await p.evaluate(()=>{window.needSetup=()=>false;try{$('guide').hidden=true}catch(e){}});return p}
export const sleep=ms=>new Promise(r=>setTimeout(r,ms));
export function report(title){const e=errs.filter(x=>!/clone|Failed to load resource/.test(x));console.log(title+': '+(e.length?e.length+' HATA\n'+e.slice(0,20).join('\n'):'HATA YOK'));return e.length}
