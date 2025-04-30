const { app, BrowserWindow, ipcMain, dialog, session } = require('electron');
const path = require('path');
const fs = require('fs');
const { initialize } = require('@electron/remote/main');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: true,  
      enableRemoteModule: true, // Enable remote module
      additionalArguments: ['--enable-features=WebRTC-CaptureService']
    },
    icon: path.join(__dirname, 'assets/images/icon.png')
  });

  // Initialize remote module
  initialize();
  require('@electron/remote/main').enable(mainWindow.webContents);

  mainWindow.loadFile('index.html');
  
  // Open DevTools for debugging
  mainWindow.webContents.openDevTools();
  
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

// Add handler for getting user data path
ipcMain.handle('get-user-data-path', () => {
  console.log('Renderer requested user data path:', app.getPath('userData'));
  return app.getPath('userData');
});