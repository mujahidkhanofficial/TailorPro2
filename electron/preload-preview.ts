const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('previewAPI', {
    savePDF: (htmlContent: string) => ipcRenderer.invoke('save-pdf', htmlContent),
});
