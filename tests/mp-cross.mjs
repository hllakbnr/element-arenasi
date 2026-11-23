// Bilgisayar (Chromium) ile telefon (Firefox motoru) aynı odada: 1v1 ve co-op, iki yönde.
import {openGame,sleep,report,closeAll} from './lib.mjs';
const st=p=>p.evaluate(()=>JSON.stringify({ph:MP.HH&&MP.HH.ph,on:MP.on,ord:MP.order.length,fb:MP.room&&MP.room.fb,w:MP.HH&&MP.HH.w,rp:Object.values(MP.rp).map(r=>(r.alive?'A':'-')+(r.dead?'D':'-')),E:typeof E!=='undefined'?E.length:0,state}));
async function round(hostKind,hostPhone,joinKind,joinPhone,mode,label){
 const A=await openGame({kind:hostKind,phone:hostPhone,user:{id:'aaaa'+Math.random().toString(36).slice(2,6),email:'a@gmail.com'},tag:label+'/oda'});
 const B=await openGame({kind:joinKind,phone:joinPhone,user:{id:'bbbb'+Math.random().toString(36).slice(2,6),email:'b@gmail.com'},tag:label+'/katılan'});
 await A.evaluate(m=>{$('mStart').click();$('moHost').click();hostCfg.mode=m;hostCfg.cap=m==='1v1'?2:2;renderHostCfg()},mode);await sleep(300);await A.evaluate(()=>$('hCreate').click());await sleep(2000);
 await B.evaluate(()=>{$('mStart').click();$('moJoin').click()});await sleep(1500);
 const listed=await B.evaluate(()=>document.querySelectorAll('#roomList .rrow').length);
 await B.evaluate(()=>{const r=document.querySelector('#roomList .rrow');r&&r.click()});
 await B.waitForFunction(()=>MP.room,null,{timeout:45000}).catch(()=>{});await sleep(2500);
 console.log(label,'liste',listed,'oda:',await st(A),'|',await st(B));
 await A.evaluate(()=>$('rStart').click());
 for(let i=0;i<5;i++){await sleep(4000);if(i===2){await A.evaluate(()=>{try{attack(0)}catch(e){}});await B.evaluate(()=>{try{attack(1)}catch(e){}})}console.log(label,'t+'+(i+1)*4,await st(A),'|',await st(B))}
 await B.evaluate(()=>mpLeave()).catch(()=>{});await A.evaluate(()=>mpLeave()).catch(()=>{});await sleep(500);await A.context().close();await B.context().close()}
await round('chromium',false,'firefox',true,'1v1','PC→telefon 1v1');
await round('firefox',true,'chromium',false,'1v1','telefon→PC 1v1');
await round('chromium',false,'firefox',true,'coop','PC→telefon co-op');
const n=report('Çapraz çok oyunculu');await closeAll();process.exit(n?1:0);
