const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('tpf', {
  openExternal: (url) => ipcRenderer.invoke('open-external', url),
  copyText: (text) => ipcRenderer.invoke('copy-text', text)
});