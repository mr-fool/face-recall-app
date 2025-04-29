const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,  // Keep security on
      additionalArguments: ['--enable-features=WebRTC-CaptureService']  // Add this line
    },
    icon: path.join(__dirname, 'assets/images/icon.png')
  });

  mainWindow.loadFile('index.html');
  
  // Open DevTools in development
  // mainWindow.webContents.openDevTools();
  
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  // Set permissions for media access
  session.defaultSession.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      // Always allow media access from our app
      callback(true);
    } else {
      callback(false);
    }
  });
  
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle file dialog for importing images
ipcMain.handle('select-photos', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile', 'multiSelections'],
    filters: [{ name: 'Images', extensions: ['jpg', 'png', 'jpeg'] }]
  });
  
  if (!result.canceled) {
    return result.filePaths;
  }
  return [];
});