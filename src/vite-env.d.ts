/// <reference types="vite/client" />

interface ElectronAPI {
    saveFile: (content: string, filename: string) => Promise<{ success: boolean; path?: string }>;
    openFile: () => Promise<{ success: boolean; content?: string; path?: string }>;
    getAppVersion: () => Promise<string>;
    printToPDF: (htmlContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
    getPrinters: () => Promise<Electron.PrinterInfo[]>;
    printSilent: (htmlContent: string, printerName: string) => Promise<{ success: boolean; error?: string }>;
    savePDF: (htmlContent: string) => Promise<{ success: boolean; path?: string; error?: string }>;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

export { };
