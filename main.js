// Element Arenası masaüstü kabuğu.
// Açılışta güncelleme denetlenir. Yeni sürüm varsa güncelleme ekranı gösterilir,
// sürüm indirilir, kurulur ve oyun kendini yeniden başlatır. Güncel değilse oyuna girilmez.
// İnternet yoksa denetim birkaç saniye sonra bırakılır ve oyun açılır.
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const dgram = require('dgram');
const http = require('http');
const os = require('os');
let autoUpdater = null;
try { autoUpdater = require('electron-updater').autoUpdater; } catch (e) {}

const PROTO = 'elementarenasi';
let win = null, pendingAuth = null;

if (process.defaultApp) {
  if (process.argv.length >= 2) app.setAsDefaultProtocolClient(PROTO, process.execPath, [path.resolve(process.argv[1])]);
} else app.setAsDefaultProtocolClient(PROTO);

if (!app.requestSingleInstanceLock()) { app.quit(); }
else {
  app.on('second-instance', (e, argv) => {
    const u = argv.find(a => a.startsWith(PROTO + '://'));
    if (u) deliver(u);
    if (win) { if (win.isMinimized()) win.restore(); win.focus(); }
  });
  app.on('open-url', (e, u) => { e.preventDefault(); deliver(u); });
  app.whenReady().then(create);
  app.on('window-all-closed', () => app.quit());
}

let gameLoaded = false;
function deliver(u) {
  if (win && gameLoaded && !win.webContents.isLoading()) win.webContents.send('ea-auth', u);
  else pendingAuth = u;
}

function create() {
  win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 900, minHeight: 540,
    backgroundColor: '#0a0d18', title: 'Element Arenası', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false,
      additionalArguments: ['--ea-version=' + app.getVersion()]
    }
  });
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    if (!url.startsWith('file:')) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); }
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.on('did-finish-load', () => {
    if (gameLoaded && pendingAuth) { win.webContents.send('ea-auth', pendingAuth); pendingAuth = null; }
  });
  const u = process.argv.find(a => a.startsWith(PROTO + '://'));
  if (u) pendingAuth = u;
  if (app.isPackaged && autoUpdater) runUpdate(); else loadGame();
}

function loadGame() {
  gameLoaded = true;
  win.loadFile(path.join(__dirname, 'game', 'index.html'));
}

function runUpdate() {
  let decided = false, state = null;
  const send = (st, data) => { state = Object.assign({ st }, data || {}); if (win && !win.isDestroyed()) win.webContents.send('ea-upd', state); };
  const play = () => { if (decided) return; decided = true; loadGame(); };
  const giveUp = setTimeout(play, 9000); // internet yoksa beklemeden oyuna gir

  autoUpdater.autoDownload = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.on('checking-for-update', () => send('check'));
  autoUpdater.on('update-not-available', () => { clearTimeout(giveUp); play(); });
  autoUpdater.on('update-available', info => {
    clearTimeout(giveUp); decided = true;
    let notes = info.releaseNotes || '';
    if (Array.isArray(notes)) notes = notes.map(n => n.note || '').join('\n');
    send('found', { v: info.version, notes: String(notes).replace(/<[^>]+>/g, '').slice(0, 1500) });
  });
  autoUpdater.on('download-progress', p => send('prog', { pct: p.percent, bps: p.bytesPerSecond, done: p.transferred, total: p.total }));
  autoUpdater.on('update-downloaded', () => { send('ready'); setTimeout(() => autoUpdater.quitAndInstall(true, true), 1800); });
  autoUpdater.on('error', e => {
    clearTimeout(giveUp);
    if (!decided) play();
    else send('err', { msg: String((e && e.message) || e).slice(0, 200) });
  });
  ipcMain.handle('ea-upd-retry', () => { send('found', state && state.v ? { v: state.v, notes: state.notes } : {}); return autoUpdater.downloadUpdate().catch(() => {}); });
  ipcMain.handle('ea-upd-state', () => state);

  win.loadFile(path.join(__dirname, 'update.html'));
  win.webContents.once('did-finish-load', () => { autoUpdater.checkForUpdates().catch(() => { clearTimeout(giveUp); play(); }); });
}

ipcMain.handle('ea-open', (e, url) => { if (typeof url === 'string' && /^https:\/\//.test(url)) return shell.openExternal(url); });

// Güncelleme notları: oyun, güncellemeden sonraki ilk açılışta gösterir.
ipcMain.handle('ea-notes', () => { try { return fs.readFileSync(path.join(__dirname, 'build', 'release-notes.md'), 'utf8').slice(0, 4000); } catch (e) { return ''; } });

// ---- Yerel ağ (LAN) odaları: sunucu yok. Oda kuran bilgisayar odasını yerel ağa duyurur,
// katılanlar küçük bir el sıkışma isteğiyle doğrudan bağlanır (oyun verisi WebRTC ile gider).
const LAN = { port: 47821, udp: null, srv: null, info: null, bt: null, scan: null, st: null, rooms: new Map(), pend: new Map(), seq: 0, hport: 0 };
function lanSend(ch, data) { if (win && !win.isDestroyed()) win.webContents.send(ch, data); }
function bcastAddrs() {
  const out = new Set(['255.255.255.255']);
  for (const l of Object.values(os.networkInterfaces())) for (const a of l || []) {
    if (a.family !== 'IPv4' && a.family !== 4) continue; if (a.internal || !a.netmask) continue;
    const ip = a.address.split('.').map(Number), mk = a.netmask.split('.').map(Number);
    out.add(ip.map((v, i) => (v & mk[i]) | (~mk[i] & 255)).join('.'));
  }
  return [...out];
}
function lanStop() {
  clearInterval(LAN.bt); LAN.bt = null; LAN.info = null;
  try { LAN.srv && LAN.srv.close(); } catch (e) {} try { LAN.udp && LAN.udp.close(); } catch (e) {}
  LAN.srv = null; LAN.udp = null; LAN.pend.forEach(f => f('')); LAN.pend.clear();
}
ipcMain.handle('lan-host', async (e, info) => {
  lanStop(); LAN.info = Object.assign({}, info);
  LAN.srv = http.createServer((req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*'); res.setHeader('Access-Control-Allow-Headers', 'content-type');
    if (req.method === 'OPTIONS') { res.end(); return; }
    if (req.method !== 'POST' || req.url !== '/sdp' || LAN.pend.size > 8) { res.statusCode = 404; res.end(); return; }
    let b = ''; req.on('data', d => { b += d; if (b.length > 65536) req.destroy(); });
    req.on('end', () => {
      let j; try { j = JSON.parse(b); } catch (x) { res.statusCode = 400; res.end(); return; }
      const id = ++LAN.seq; const t = setTimeout(() => { if (LAN.pend.has(id)) { LAN.pend.delete(id); res.statusCode = 504; res.end('{}'); } }, 10000);
      LAN.pend.set(id, sdp => { clearTimeout(t); res.setHeader('content-type', 'application/json'); res.end(JSON.stringify({ sdp: String(sdp || '') })); });
      lanSend('lan-offer', { id, k: String(j.k || '').slice(0, 40), sdp: String(j.sdp || '').slice(0, 20000) });
    });
  });
  await new Promise((res, rej) => { LAN.srv.once('error', rej); LAN.srv.listen(0, '0.0.0.0', res); });
  LAN.hport = LAN.srv.address().port;
  LAN.udp = dgram.createSocket({ type: 'udp4', reuseAddr: true }); LAN.udp.on('error', () => {});
  await new Promise(r => LAN.udp.bind(() => { try { LAN.udp.setBroadcast(true); } catch (x) {} r(); }));
  const beat = () => { if (!LAN.info || !LAN.udp) return; const msg = Buffer.from(JSON.stringify(Object.assign({ ea: 1 }, LAN.info, { port: LAN.hport })));
    bcastAddrs().forEach(a => { try { LAN.udp.send(msg, LAN.port, a, () => {}); } catch (x) {} }); };
  beat(); LAN.bt = setInterval(beat, 1000); return { port: LAN.hport };
});
ipcMain.handle('lan-update', (e, info) => { if (LAN.info) LAN.info = Object.assign({}, LAN.info, info); });
ipcMain.handle('lan-answer', (e, id, sdp) => { const f = LAN.pend.get(id); if (f) { LAN.pend.delete(id); f(sdp); } });
ipcMain.handle('lan-stop', () => lanStop());
ipcMain.handle('lan-scan', (e, on) => {
  if (on && !LAN.scan) {
    const s = dgram.createSocket({ type: 'udp4', reuseAddr: true });
    s.on('message', (b, ri) => { try { const j = JSON.parse(b.toString()); if (j.ea !== 1) return;
      LAN.rooms.set(ri.address + ':' + j.port, { ip: ri.address, port: j.port | 0, c: String(j.c || '').slice(0, 8), hn: String(j.hn || '').slice(0, 20), m: String(j.m || '').slice(0, 6), n: j.n | 0, cap: j.cap | 0, t: Date.now() }); } catch (x) {} });
    s.on('error', () => {}); s.bind(LAN.port); LAN.scan = s;
    LAN.st = setInterval(() => { const now = Date.now(); for (const [k, v] of LAN.rooms) if (now - v.t > 3500) LAN.rooms.delete(k); lanSend('lan-rooms', [...LAN.rooms.values()]); }, 1000);
  } else if (!on && LAN.scan) { clearInterval(LAN.st); try { LAN.scan.close(); } catch (x) {} LAN.scan = null; LAN.rooms.clear(); }
});
app.on('before-quit', () => lanStop());
