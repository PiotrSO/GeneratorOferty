const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  savePDF: (defaultName, htmlContent) => ipcRenderer.send('save-pdf', defaultName, htmlContent),
  onPDFSaved: (callback) => ipcRenderer.once('pdf-saved', (_event, ...args) => callback(...args)),
  onLoadWorkspace: (callback) => ipcRenderer.on('load-workspace', (_event, ...args) => callback(...args)),
  
  // Metody zarządzania projektem
  saveProject: (projectData) => ipcRenderer.invoke('save-project', projectData),
  loadProject: () => ipcRenderer.invoke('load-project'),
  setDirty: (value) => ipcRenderer.send('set-dirty', value),
  onTriggerSaveOnClose: (callback) => ipcRenderer.on('trigger-save-on-close', (_event, ...args) => callback(...args)),
  closeAppForced: () => ipcRenderer.send('close-app-forced')
});
