import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
    saveFile: (content: string, filename: string) =>
        ipcRenderer.invoke('save-file', content, filename),

    openFile: () =>
        ipcRenderer.invoke('open-file'),

    getAppVersion: () =>
        ipcRenderer.invoke('get-app-version'),

    printToPDF: (htmlContent: string) =>
        ipcRenderer.invoke('print-to-pdf', htmlContent),

    getPrinters: () =>
        ipcRenderer.invoke('get-printers'),

    printSilent: (htmlContent: string, printerName: string) =>
        ipcRenderer.invoke('print-silent', htmlContent, printerName),

    savePDF: (htmlContent: string) =>
        ipcRenderer.invoke('save-pdf', htmlContent),
});
