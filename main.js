// Element Arenası masaüstü kabuğu.
// Açılışta güncelleme denetlenir. Yeni sürüm varsa güncelleme ekranı gösterilir,
// sürüm indirilir, kurulur ve oyun kendini yeniden başlatır. Güncel değilse oyuna girilmez.
// İnternet yoksa denetim birkaç saniye sonra bırakılır ve oyun açılır.
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
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
