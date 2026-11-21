// Element Arenası masaüstü kabuğu.
// Oyun her açılışta internetteki en güncel sürümden yüklenir (app-config.json → remote).
// İnternet yoksa uygulamanın içindeki kopya açılır (misafir modu çalışır).
const { app, BrowserWindow, shell, ipcMain } = require('electron');
const path = require('path');
let REMOTE = '';
try { REMOTE = (require('./app-config.json').remote || '').trim(); } catch (e) {}

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

function deliver(u) {
  if (win && !win.webContents.isLoading()) win.webContents.send('ea-auth', u);
  else pendingAuth = u;
}

function create() {
  win = new BrowserWindow({
    width: 1280, height: 760, minWidth: 900, minHeight: 540,
    backgroundColor: '#0a0d18', title: 'Element Arenası', autoHideMenuBar: true,
    icon: path.join(__dirname, 'build', 'icon.png'),
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  win.setMenu(null);
  win.webContents.setWindowOpenHandler(({ url }) => { if (/^https?:\/\//.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  win.webContents.on('will-navigate', (e, url) => {
    const ok = url.startsWith('file:') || (REMOTE && url.startsWith(REMOTE));
    if (!ok) { e.preventDefault(); if (/^https?:\/\//.test(url)) shell.openExternal(url); }
  });
  win.webContents.on('before-input-event', (e, input) => {
    if (input.type === 'keyDown' && input.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
  });
  win.webContents.on('did-finish-load', () => {
    if (pendingAuth) { win.webContents.send('ea-auth', pendingAuth); pendingAuth = null; }
  });
  const local = () => win.loadFile(path.join(__dirname, 'game', 'index.html'));
  if (REMOTE) {
    let fell = false;
    win.webContents.on('did-fail-load', (e, code, desc, url, isMain) => { if (isMain && !fell) { fell = true; local(); } });
    win.loadURL(REMOTE + (REMOTE.includes('?') ? '&' : '?') + 'app=1&v=' + Date.now()).catch(() => { if (!fell) { fell = true; local(); } });
  } else local();
  const u = process.argv.find(a => a.startsWith(PROTO + '://'));
  if (u) pendingAuth = u;
}

ipcMain.handle('ea-open', (e, url) => { if (typeof url === 'string' && /^https:\/\//.test(url)) return shell.openExternal(url); });
