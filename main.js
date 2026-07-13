const { app, BrowserWindow, protocol, ipcMain, dialog, net } = require('electron');
const path = require('path');
const fs = require('fs');
const { pathToFileURL } = require('url');

let win;
let isDirty = false;
let isClosing = false;

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    title: "System Serwis - Generator Ofert",
    icon: path.join(__dirname, 'assets', 'Logo_SYSTEM_SERWIS_wersja_podstawowa_RGB.png'), 
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegrationInSubFrames: true,
      webSecurity: false
    }
  });

  win.setMenuBarVisibility(false);
  win.loadFile('index.html');

  win.on('close', async (e) => {
    if (isClosing) return;
    
    if (isDirty) {
      e.preventDefault();
      const { response } = await dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['Zapisz i wyjdź', 'Wyjdź bez zapisywania', 'Anuluj'],
        defaultId: 0,
        cancelId: 2,
        title: 'Niezapisane zmiany',
        message: 'Projekt zawiera niezapisane zmiany. Czy chcesz zapisać projekt przed wyjściem?'
      });
      
      if (response === 0) {
        win.webContents.send('trigger-save-on-close');
      } else if (response === 1) {
        isClosing = true;
        win.close();
      }
    }
  });
}

app.whenReady().then(() => {
  protocol.handle('local-ss', (request) => {
    try {
      const url = request.url.replace('local-ss://', '');
      const decodedPath = decodeURIComponent(url);
      const fullPath = path.normalize(path.join(__dirname, decodedPath));
      return net.fetch(pathToFileURL(fullPath).toString());
    } catch (error) {
      console.error('Błąd protokołu local-ss:', error);
      return new Response('Błąd wczytywania zasobu lokalnego', { status: 500 });
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
      show: false,
      transparent: true,
      frame: false,
      skipTaskbar: true,
      width: 1280,
      height: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
        backgroundThrottling: false,
        nodeIntegrationInSubFrames: true,
        webSecurity: false
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

    offscreenWin.loadFile('src/offer.html');

  } catch (error) {
    console.error('Błąd dialogu:', error);
    event.sender.send('pdf-saved');
  }
});

// OBSŁUGA ZARZĄDZANIA PROJEKTEM (.ssproj / .json)
ipcMain.on('set-dirty', (event, value) => {
  isDirty = value;
});

ipcMain.on('close-app-forced', () => {
  isClosing = true;
  if (win && !win.isDestroyed()) {
    win.close();
  }
});

ipcMain.handle('save-project', async (event, projectDataString) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  try {
    const { filePath } = await dialog.showSaveDialog(parentWin, {
      title: 'Zapisz Projekt',
      defaultPath: 'projekt-oferty.ssproj',
      filters: [{ name: 'Projekt System Serwis', extensions: ['ssproj', 'json'] }]
    });

    if (!filePath) {
      return { cancelled: true };
    }

    fs.writeFileSync(filePath, projectDataString, 'utf8');
    isDirty = false;
    return { success: true, filePath };
  } catch (error) {
    console.error('Błąd zapisu projektu:', error);
    return { error: error.message };
  }
});

ipcMain.handle('load-project', async (event) => {
  const parentWin = BrowserWindow.fromWebContents(event.sender);
  try {
    const { filePaths } = await dialog.showOpenDialog(parentWin, {
      title: 'Wczytaj Projekt',
      filters: [{ name: 'Projekt System Serwis', extensions: ['ssproj', 'json'] }],
      properties: ['openFile']
    });

    if (!filePaths || filePaths.length === 0) {
      return { cancelled: true };
    }

    const content = fs.readFileSync(filePaths[0], 'utf8');
    isDirty = false;
    return { success: true, content, filePath: filePaths[0] };
  } catch (error) {
    console.error('Błąd wczytywania projektu:', error);
    return { error: error.message };
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});