// Turnuva dayanıklılık testi: bot oynar, her kahramanla, kaynak sayıları ve takılmalar ölçülür.
import {openGame,report,closeAll,errs} from './lib.mjs';
const kind=process.argv[2]||'chromium',phone=process.argv[3]==='phone',SECS=+(process.argv[4]||120);
const p=await openGame({kind,phone,tag:kind+(phone?'/telefon':'')});
const r=await p.evaluate(async SECS=>{
 window.__INP={mx:0,mz:0,block:false};window.inpFor=Pl=>Pl===P?__INP:{mx:0,mz:0,block:false};
 let at=0,n=0;const bot=dt=>{at-=dt;let t=null,b=1e9;for(const e of E){if(e.entering||e.dying!=null)continue;const d=Math.hypot(e.x-P.x,e.z-P.z);if(d<b){b=d;t=e}}if(!t||P.spin){__INP.mx=__INP.mz=0;return}const dx=t.x-P.x,dz=t.z-P.z,d=Math.hypot(dx,dz)||1;if(d>2.1){__INP.mx=dx/d;__INP.mz=dz/d}else{__INP.mx=__INP.mz=0;if(at<=0){at=.3;n++;attack(n%4===0?1:0)}}};
 const ui=['menu','guide','nDlg','auth','modes','sel'];ui.forEach(i=>{const el=$(i);if(el)el.hidden=true});document.body.classList.remove('menu');
 const heroes=KEYS.slice();let hi=0,runT=0;start(heroes[0]);const dt=1/30;let T=0,stepN=0;const slow=[],log=[];let progs=R.info.programs.length,comp=[];
 while(T<SECS){T+=dt;runT+=dt;stepN++;const t0=performance.now();
  if(state==='play'){bot(dt);if(P.en>=100&&!P.spin&&Math.random()<.02)tryVortex();if(P.sc<=0&&Math.random()<.01)special();if(Math.random()<.004)grab();if(grabbing&&grabbing.e&&Math.random()<.05)grab();
   if(hs>0){hs-=dt;update(dt*.06)}else update(dt);if(runT>40&&!P.dead){P.hp=0;end()}}
  else if(state==='shop')$('shopGo').click();
  else if(state==='over'){hi=(hi+1)%heroes.length;runT=0;if(hi%2===0){SET.arena=SET.arena===1?0:1;applyArena()}start(heroes[hi]);document.body.classList.remove('menu')}
  view(dt);if(stepN%2===0)R.render(S,cam);const ms=performance.now()-t0;slow.push([ms,T.toFixed(1)+'s '+state+' '+(P&&P.k)+' E'+E.length+' FX'+FX.length]);
  if(R.info.programs.length!==progs){if(T>2)comp.push(T.toFixed(1)+'s '+(P&&P.k)+' +'+(R.info.programs.length-progs));progs=R.info.programs.length}
  if(stepN%300===0){const m=R.info.memory;log.push(Math.round(T)+'s '+(P&&P.k)+' w'+wave+' geo'+m.geometries+' tex'+m.textures+' prog'+R.info.programs.length)}
  if(stepN%60===0)await new Promise(r=>setTimeout(r,0))}
 slow.sort((a,b)=>b[0]-a[0]);const gl=R.getContext(),dbg=gl.getExtension('WEBGL_debug_renderer_info');
 return {gpu:dbg?gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL):'?',isGL2:R.capabilities.isWebGL2,log,comp,slow:slow.slice(0,8).map(x=>Math.round(x[0])+'ms '+x[1])}},SECS).catch(e=>({fail:e.message}));
console.log(JSON.stringify(r,null,1));const n=report('Dayanıklılık '+kind+(phone?' telefon':''));await closeAll();process.exit(n?1:0);
