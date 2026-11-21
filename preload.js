// Oyuna sadece iki şey açılır: Google girişini tarayıcıda açmak ve girişten dönen adresi almak.
const { contextBridge, ipcRenderer } = require('electron');
contextBridge.exposeInMainWorld('eaDesk', {
  open: (url) => ipcRenderer.invoke('ea-open', url),
  onAuth: (cb) => ipcRenderer.on('ea-auth', (e, u) => cb(u))
});
