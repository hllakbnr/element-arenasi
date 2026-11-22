// Oyuna açılan küçük köprü: Google girişi, güncelleme ekranı, sürüm numarası, güncelleme notları ve yerel ağ odaları.
const { contextBridge, ipcRenderer } = require('electron');
const verArg = process.argv.find(a => a.startsWith('--ea-version='));
contextBridge.exposeInMainWorld('eaDesk', {
  version: verArg ? verArg.split('=')[1] : '',
  open: (url) => ipcRenderer.invoke('ea-open', url),
  onAuth: (cb) => ipcRenderer.on('ea-auth', (e, u) => cb(u)),
  onUpdate: (cb) => ipcRenderer.on('ea-upd', (e, s) => cb(s)),
  updateState: () => ipcRenderer.invoke('ea-upd-state'),
  retryUpdate: () => ipcRenderer.invoke('ea-upd-retry'),
  notes: () => ipcRenderer.invoke('ea-notes'),
  lan: {
    host: (i) => ipcRenderer.invoke('lan-host', i),
    update: (i) => ipcRenderer.invoke('lan-update', i),
    stop: () => ipcRenderer.invoke('lan-stop'),
    scan: (on) => ipcRenderer.invoke('lan-scan', !!on),
    answer: (id, sdp) => ipcRenderer.invoke('lan-answer', id, sdp),
    onRooms: (cb) => ipcRenderer.on('lan-rooms', (e, l) => cb(l)),
    onOffer: (cb) => ipcRenderer.on('lan-offer', (e, o) => cb(o))
  }
});
