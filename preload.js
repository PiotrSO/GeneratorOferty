const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePDF: (defaultName, htmlContent) => ipcRenderer.send('save-pdf', defaultName, htmlContent),
  onPDFSaved: (callback) => ipcRenderer.once('pdf-saved', (_event, ...args) => callback(...args)),
  onLoadWorkspace: (callback) => ipcRenderer.on('load-workspace', (_event, ...args) => callback(...args)),
  // Możemy dodać więcej bezpiecznych metod tutaj
});
