/**
 * app.js - Main application logic module
 * 
 * This module coordinates the interaction between all other modules
 * and serves as the glue that binds the application together.
 */

// Application state
let modules = {
    ui: null,
    database: null,
    camera: null,
    recognition: null,
    people: null,
    settings: null,
    utils: null
  };
  
  // Debug helper
  function logDebug(message) {
    console.log(`[APP] ${message}`);
  }
  
  /**
   * Initialize the app module
   * @param {Object} dependencies - Object containing module dependencies
   */
  function init(dependencies) {
    logDebug('Initializing app module');
    
    // Store module references
    modules = dependencies;
    
    // Connect modules with event listeners
    connectModules();
    
    logDebug('App module initialized');
  }
  
  /**
   * Connect modules together with event listeners
   */
  function connectModules() {
    // Get UI elements
    const {
      takePhotoButton,
      addPersonForm,
      selectPhotosButton,
      exportDataButton,
      importDataButton,
      clearDataButton
    } = modules.ui.getElements();
    
    // Connect camera controls
    takePhotoButton.addEventListener('click', async () => {
      const imageData = await modules.camera.takePhoto();
      if (imageData) {
        modules.recognition.recognizeFace(imageData);
      }
    });
    
    // Connect people management
    addPersonForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const personData = modules.ui.getPersonFormData();
      await modules.people.savePerson(personData);
    });
    
    selectPhotosButton.addEventListener('click', async () => {
      const photos = await modules.people.selectPhotos();
      modules.ui.displayPhotoPreview(photos);
    });
    
    // Connect data management
    exportDataButton.addEventListener('click', () => modules.people.exportData());
    importDataButton.addEventListener('click', () => modules.people.importData());
    clearDataButton.addEventListener('click', () => modules.people.clearData());
    
    // Apply settings
    modules.settings.applySettings();
  }
  
  // Export the module functions
  module.exports = {
    init
  };