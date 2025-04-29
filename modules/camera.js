const { ipcMain } = require('electron');

// Setup camera access handlers
function setupCameraHandlers(mainWindow) {
  // Start camera request from renderer
  ipcMain.on('start-camera', () => {
    mainWindow.webContents.send('camera-started');
  });
  
  // Stop camera request from renderer
  ipcMain.on('stop-camera', () => {
    mainWindow.webContents.send('camera-stopped');
  });
  
  // Take photo request from renderer
  ipcMain.on('take-photo', () => {
    mainWindow.webContents.send('photo-taken');
  });
}

module.exports = {
  setupCameraHandlers
};