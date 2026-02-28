import { contextBridge, ipcRenderer } from 'electron';

try {
    contextBridge.exposeInMainWorld('previewAPI', {
        savePDF: () => ipcRenderer.invoke('save-pdf'),
        log: (msg: string) => ipcRenderer.send('log-msg', msg)
    });
    console.log('Preview API exposed successfully');
} catch (error) {
    console.error('Failed to expose Preview API:', error);
}
