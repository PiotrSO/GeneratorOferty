const { app, BrowserWindow, protocol, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "System Serwis - Generator Ofert",
    icon: path.join(__dirname, 'Logo_SYSTEM_SERWIS_wersja_podstawowa_RGB.png'), 
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      nodeIntegrationInSubFrames: true
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('local-ss', (request, callback) => {
    const url = request.url.replace('local-ss://', '');
    try {
      const decodedPath = decodeURIComponent(url);
      const fullPath = path.normalize(path.join(__dirname, decodedPath));
      callback({ path: fullPath });
    } catch (error) {
      console.error('Błąd protokołu local-ss:', error);
    }
  });

  createWindow();
});

// OBSŁUGA ZAPISU DO PDF W TLE (Silnik Chromium printToPDF)
ipcMain.on('save-pdf', async (event, defaultName, htmlContent) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  
  try {
    const { filePath } = await dialog.showSaveDialog(parentWin, {
      title: 'Zapisz Ofertę jako PDF',
      defaultPath: defaultName || 'Oferta.pdf',
      filters: [{ name: 'Dokument PDF', extensions: ['pdf'] }]
    });

    if (!filePath) {
      event.sender.send('pdf-saved'); 
      return;
    }

    const offscreenWin = new BrowserWindow({
      show: true,
      transparent: true,
      frame: false,
      skipTaskbar: true,
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        backgroundThrottling: false,
        nodeIntegrationInSubFrames: true
      }
    });

    const globalTimeout = setTimeout(() => {
       if (!offscreenWin.isDestroyed()) {
           console.log("PDF generation completely timed out, forcing close.");
           event.sender.send('pdf-saved');
           offscreenWin.close();
       }
    }, 12000);

    offscreenWin.setOpacity(0.01);

    offscreenWin.webContents.on('did-finish-load', async () => {
      if (htmlContent) {
        offscreenWin.webContents.send('load-workspace', htmlContent);
      }

      setTimeout(async () => {
        try {
          const pdfData = await offscreenWin.webContents.printToPDF({
            printBackground: true,
            pageSize: 'A4',
            marginsType: 1
          });
          
          clearTimeout(globalTimeout);
          
          const fs = require('fs');
          fs.writeFile(filePath, pdfData, (err) => {
            if (err) console.error('Błąd zapisu pliku:', err);
            event.sender.send('pdf-saved'); 
            if (!offscreenWin.isDestroyed()) offscreenWin.close();
          });
        } catch (e) {
           console.error('Błąd generowania PDF:', e);
           clearTimeout(globalTimeout);
           event.sender.send('pdf-saved');
           if (!offscreenWin.isDestroyed()) offscreenWin.close();
        }
      }, 1500); 
    });

    offscreenWin.loadFile('OfertaZm1102.html');

  } catch (error) {
    console.error('Błąd dialogu:', error);
    event.sender.send('pdf-saved');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});