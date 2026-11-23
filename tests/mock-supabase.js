// Supabase taklidi: kanallar sayfalar arası __sbBus ile, kullanıcı localStorage 'mockUser' ile
(()=>{window.EA_CONFIG={url:'https://proj.supabase.co',key:'anon',owner:'sahip@gmail.com'};
 const chans=new Map();window.__sbRecv=(name,ev,payload)=>{const c=chans.get(name);if(!c||c.dead)return;if(ev==='presence'){c.pstate=payload;c.hs.filter(h=>h.t==='presence').forEach(h=>h.f())}else c.hs.filter(h=>h.t==='broadcast'&&h.e===ev).forEach(h=>h.f({payload}))};
 window.supabase={createClient(){const user=JSON.parse(localStorage.getItem('mockUser')||'null');return{
  auth:{getSession:async()=>({data:{session:user?{user}:null}}),onAuthStateChange(){},signInWithOAuth:async o=>{window.__oauth=o;return{data:{url:'https://accounts.google.com/x'},error:null}},exchangeCodeForSession:async()=>({error:null}),signOut:async()=>{localStorage.removeItem('mockUser')}},
  channel(name,opt){const c={hs:[],pstate:{},key:opt&&opt.config&&opt.config.presence?opt.config.presence.key:'x'+Math.random().toString(36).slice(2,8),
   on(t,f2,f){if(t==='presence')c.hs.push({t,f});else if(t==='broadcast')c.hs.push({t,e:f2.event,f});return c},
   subscribe(cb){c.dead=false;chans.set(name,c);window.__sbJoin(name,c.key);setTimeout(()=>cb&&cb('SUBSCRIBED'),20);return c},track:async p=>{await new Promise(r=>setTimeout(r,60));if(c.dead)return;window.__sbTrack&&window.__sbTrack(name,c.key,p)},untrack:async()=>{window.__sbTrack&&window.__sbTrack(name,c.key,null)},presenceState:()=>c.pstate,
   send:async m=>{await new Promise(r=>setTimeout(r,90+Math.random()*60));if(c.dead)return 'error';window.__sbSend(name,c.key,m.event,m.payload);return 'ok'}};return c},
  removeChannel:async c=>{c.dead=true;for(const [n,x] of chans)if(x===c)chans.delete(n)},from:()=>{const q={select:()=>q,order:async()=>({data:[],error:null}),eq:()=>q,single:async()=>({data:null,error:{code:'x'}}),upsert:async()=>({error:null}),update:()=>q,delete:()=>q};return q},
  storage:{from:()=>({upload:async()=>({error:null}),remove:async()=>({})})}}}}})();
