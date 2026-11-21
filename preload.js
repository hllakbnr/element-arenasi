// Oyuna açılan küçük köprü: Google girişi, güncelleme ekranı ve sürüm numarası.
const { contextBridge, ipcRenderer } = require('electron');
const verArg = process.argv.find(a => a.startsWith('--ea-version='));
contextBridge.exposeInMainWorld('eaDesk', {
  version: verArg ? verArg.split('=')[1] : '',
  open: (url) => ipcRenderer.invoke('ea-open', url),
  onAuth: (cb) => ipcRenderer.on('ea-auth', (e, u) => cb(u)),
  onUpdate: (cb) => ipcRenderer.on('ea-upd', (e, s) => cb(s)),
  updateState: () => ipcRenderer.invoke('ea-upd-state'),
  retryUpdate: () => ipcRenderer.invoke('ea-upd-retry')
});
