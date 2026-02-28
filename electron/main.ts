import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';
import { exec } from 'child_process';
// In CommonJS, __dirname is globally available
// We don't need to define it manually
// const __dirname = path.dirname(__filename);
let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: 'Tailor Pro',
        icon: path.join(__dirname, '../public/icon.png'),
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.js'),
        },
        show: false,
    });

    // Load the app
    if (process.env.NODE_ENV === 'development' || !app.isPackaged) {
        mainWindow.loadURL('http://localhost:5173');
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
    }

    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

// App lifecycle
app.disableHardwareAcceleration(); // Disable GPU acceleration for performance/compatibility
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// IPC Handlers for file operations
// IPC Handlers for file operations
ipcMain.handle('save-file', async (_event, content: string, filename: string) => {
    const { filePath } = await dialog.showSaveDialog({
        defaultPath: filename,
        filters: [
            { name: 'Backup Files', extensions: ['json'] },
            { name: 'CSV Files', extensions: ['csv'] },
        ],
    });

    if (filePath) {
        await fs.promises.writeFile(filePath, content, 'utf-8');
        return { success: true, path: filePath };
    }
    return { success: false };
});

ipcMain.handle('open-file', async () => {
    const { filePaths } = await dialog.showOpenDialog({
        filters: [{ name: 'Backup', extensions: ['json'] }],
        properties: ['openFile'],
    });

    if (filePaths && filePaths[0]) {
        const content = await fs.promises.readFile(filePaths[0], 'utf-8');
        return { success: true, content, path: filePaths[0] };
    }
    return { success: false };
});

ipcMain.handle('get-app-version', () => {
    return app.getVersion();
});

// 1. SAVE PDF Handler (Directly Generates A5 PDF from current window)
ipcMain.handle('save-pdf', async () => {
    try {
        const win = BrowserWindow.getFocusedWindow();
        if (!win || win.isDestroyed()) {
            throw new Error('PDF unavailable: window invalid');
        }

        const { canceled, filePath } = await dialog.showSaveDialog(win, {
            title: 'Save PDF',
            defaultPath: `Measurement-Slip-${Date.now()}.pdf`,
            filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
            properties: ['showOverwriteConfirmation', 'createDirectory']
        });

        if (canceled || !filePath) {
            return { success: false, canceled: true };
        }

        // Generate PDF buffer from the active window
        const pdfData = await win.webContents.printToPDF({
            printBackground: true,
            landscape: false,
            pageSize: 'A5',
            margins: { top: 0, bottom: 0, left: 0, right: 0 }
        });

        // Save buffer to actual NTFS file path selected by user
        await fs.promises.writeFile(filePath, pdfData);

        // Open the file after saving (Native behavior)
        const cmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
        exec(`${cmd} "" "${filePath}"`);
        
        return { success: true, path: filePath };
    } catch (error: any) {
        console.error('Save PDF Error:', error);
        return { success: false, error: error.message };
    }
});

// 2. PRINT PREVIEW Handler (HTML Based)
// 2. PRINT PREVIEW Handler (HTML Based)
ipcMain.handle('print-to-pdf', async (_event, htmlContent: string) => {
    let previewWindow: BrowserWindow | null = null;
    try {
        const preloadPath = path.join(__dirname, 'preload-preview.js');
        console.log('Using preload script at:', preloadPath); // Debug log

        if (!fs.existsSync(preloadPath)) {
            console.error('Preload script not found at:', preloadPath);
            return { success: false, error: 'Internal Error: Preload script missing' };
        }

        previewWindow = new BrowserWindow({
            width: 600,
            height: 900,
            title: 'Print Preview',
            icon: path.join(__dirname, '../public/icon.png'),
            autoHideMenuBar: true,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preloadPath,
                sandbox: false, // Important for some preload features
                webSecurity: false // Allow loading local resources
            }
        });

        // Debugging: Open DevTools for the preview window to see why preload fails
        previewWindow.webContents.openDevTools({ mode: 'detach' });

        // Inject Control UI into the HTML
        const uiScript = `
            <style>
                #print-controls {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    background: #ffffff;
                    padding: 12px 24px;
                    border-radius: 50px;
                    box-shadow: 0 5px 20px rgba(0,0,0,0.25);
                    display: flex;
                    gap: 15px;
                    z-index: 99999;
                    font-family: system-ui, -apple-system, sans-serif;
                    border: 1px solid #e5e7eb;
                }
                .btn {
                    padding: 10px 20px;
                    border: none;
                    border-radius: 25px;
                    cursor: pointer;
                    font-size: 14px;
                    font-weight: 600;
                    transition: all 0.2s ease;
                    display: flex;
                    align-items: center;
                    gap: 6px;
                }
                .btn:hover { transform: translateY(-1px); box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
                .btn:active { transform: translateY(0); }
                .btn-primary { background: #2563eb; color: white; }
                .btn-primary:hover { background: #1d4ed8; }
                .btn-success { background: #059669; color: white; }
                .btn-success:hover { background: #047857; }
                .btn-secondary { background: #f3f4f6; color: #374151; }
                .btn-secondary:hover { background: #e5e7eb; }
                @media print { #print-controls { display: none !important; } }
            </style>
            <div id="print-controls">
                <button class="btn btn-primary" onclick="window.print()">
                    <span>🖨️ Print Paper</span>
                </button>
                <button class="btn btn-success" onclick="saveAsPDF()">
                    <span>💾 Save PDF (A5)</span>
                </button>
                <button class="btn btn-secondary" onclick="window.close()">
                    <span>Close</span>
                </button>
            </div>
            <script>
                async function saveAsPDF() {
                    try {
                        if (window.previewAPI && window.previewAPI.savePDF) {
                            const result = await window.previewAPI.savePDF();
                            if (!result.success && !result.canceled) {
                                alert('Save Error: ' + (result.error || 'Unknown error'));
                            }
                        } else {
                            alert('Save API not available. Please restart the app.');
                        }
                    } catch (err: any) {
                        alert('Save Error: ' + err.message);
                    }
                }
            ${'<' + '/script>'}
        `;

        // Inject controls
        const contentWithUI = htmlContent.replace('</body>', `${uiScript}</body>`);

        // WRITE TO TEMP FILE
        // Using a unique filename to avoid collisions
        const tempPath = path.join(app.getPath('temp'), `preview_${Date.now()}.html`);
        await fs.promises.writeFile(tempPath, contentWithUI, 'utf-8');

        // Load the file
        await previewWindow.loadURL(`file://${tempPath}`);

        // Cleanup on close
        previewWindow.on('closed', () => {
            // Attempt to unlink, ignore errors if file is locked or missing
            fs.promises.unlink(tempPath).catch(() => { });
            previewWindow = null;
        });

        return { success: true };

    } catch (error: any) {
        console.error('Preview Error:', error);
        if (previewWindow) previewWindow.close();
        return { success: false, error: error.message };
    }
});

// 3. GET PRINTERS Handler
ipcMain.handle('get-printers', async () => {
    if (mainWindow) {
        return await mainWindow.webContents.getPrintersAsync();
    }
    return [];
});

// 4. SILENT PRINT Handler
ipcMain.handle('print-silent', async (_event, htmlContent: string, printerName: string) => {
    let printWindow: BrowserWindow | null = null;
    try {
        printWindow = new BrowserWindow({
            show: false,
            webPreferences: {
                nodeIntegration: true,
                contextIsolation: false // Simplifies content injection for invalid HTML safety
            }
        });

        await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);

        // Check availability
        const printers = await printWindow.webContents.getPrintersAsync();
        const targetPrinter = printers.find(p => p.name === printerName);

        if (!targetPrinter) {
            printWindow.close();
            return { success: false, error: 'Printer not found' };
        }

        // Print
        await new Promise<void>((resolve, reject) => {
            printWindow!.webContents.print({
                silent: true,
                deviceName: printerName,
                printBackground: true,
                margins: { marginType: 'none' }
            }, (success, errorType) => {
                if (!success) reject(new Error(errorType));
                else resolve();
            });
        });

        printWindow.close();
        return { success: true };

    } catch (error: any) {
        console.error('Silent Print Error:', error);
        if (printWindow) printWindow.close();
        return { success: false, error: error.message };
    }
});
