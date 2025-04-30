// Entry point for the renderer process
const { ipcRenderer } = require('electron');
console.log('Renderer.js loading...');

// Import modules
const appModule = require('./modules/app');
const uiModule = require('./modules/ui');
const databaseModule = require('./modules/database');
const cameraModule = require('./modules/camera');
const recognitionModule = require('./modules/recognition');
const peopleModule = require('./modules/people');
const settingsModule = require('./modules/settings');
const utilsModule = require('./modules/utils');

// Debug helper
function logDebug(message) {
  console.log(`[DEBUG] ${message}`);
}

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  logDebug('DOM fully loaded - starting application');
  initApp();
});

// Also call init directly in case DOMContentLoaded already fired
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  logDebug('Document already loaded - starting application immediately');
  setTimeout(initApp, 0);
}

// Initialize the application
async function initApp() {
  try {
    logDebug('Initializing application...');
    
    // Initialize database first
    const userDataPath = await ipcRenderer.invoke('get-user-data-path');
    await databaseModule.init(userDataPath);
    
    // Initialize UI
    uiModule.init();
    
    // Initialize settings
    settingsModule.init();
    
    // Initialize people module after database
    await peopleModule.init();
    
    // Initialize camera and recognition modules
    cameraModule.init();
    recognitionModule.init(peopleModule);
    
    // Initialize the main app
    appModule.init({
      ui: uiModule,
      database: databaseModule,
      camera: cameraModule,
      recognition: recognitionModule,
      people: peopleModule,
      settings: settingsModule,
      utils: utilsModule
    });
    
    logDebug('Application initialized successfully');
  } catch (error) {
    console.error('Error during app initialization:', error);
  }
}