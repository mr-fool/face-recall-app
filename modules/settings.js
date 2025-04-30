/**
 * settings.js - Application settings module
 * 
 * This module handles loading, saving, and applying application settings
 */

// Module dependencies
const ui = require('./ui');

// Debug helper
function logDebug(message) {
  console.log(`[SETTINGS] ${message}`);
}

// Default settings
const DEFAULT_SETTINGS = {
  confidenceThreshold: 0.6,
  announcementMode: 'name',
  textSize: 'normal',
  highContrast: false
};

// Current settings
let currentSettings = { ...DEFAULT_SETTINGS };

/**
 * Initialize the settings module
 */
function init() {
  logDebug('Initializing settings module');
  
  // Load saved settings
  loadSettings();
  
  // Setup event listeners
  setupEventListeners();
  
  // Apply settings to UI
  applySettings();
  
  logDebug('Settings module initialized');
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  try {
    const savedSettings = JSON.parse(localStorage.getItem('faceRecallSettings') || '{}');
    currentSettings = { ...DEFAULT_SETTINGS, ...savedSettings };
    logDebug('Settings loaded from localStorage');
  } catch (error) {
    console.error('Error loading settings:', error);
    currentSettings = { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  try {
    localStorage.setItem('faceRecallSettings', JSON.stringify(currentSettings));
    logDebug('Settings saved to localStorage');
  } catch (error) {
    console.error('Error saving settings:', error);
  }
}

/**
 * Apply settings to UI and app behavior
 */
function applySettings() {
  const elements = ui.getElements();
  
  // Apply confidence threshold
  if (elements.confidenceThreshold) {
    elements.confidenceThreshold.value = currentSettings.confidenceThreshold;
    if (elements.confidenceThresholdValue) {
      elements.confidenceThresholdValue.textContent = currentSettings.confidenceThreshold;
    }
  }
  
  // Apply announcement mode
  if (elements.announcementMode) {
    elements.announcementMode.value = currentSettings.announcementMode;
  }
  
  // Apply text size
  if (elements.textSize) {
    elements.textSize.value = currentSettings.textSize;
    applyTextSize();
  }
  
  // Apply high contrast mode
  if (elements.highContrast) {
    elements.highContrast.checked = currentSettings.highContrast;
    applyContrastMode();
  }
  
  logDebug('Settings applied');
}

/**
 * Set up event listeners for settings changes
 */
function setupEventListeners() {
  const elements = ui.getElements();
  
  // Confidence threshold
  if (elements.confidenceThreshold) {
    elements.confidenceThreshold.addEventListener('input', () => {
      currentSettings.confidenceThreshold = elements.confidenceThreshold.value;
      if (elements.confidenceThresholdValue) {
        elements.confidenceThresholdValue.textContent = elements.confidenceThreshold.value;
      }
      saveSettings();
    });
  }
  
  // Announcement mode
  if (elements.announcementMode) {
    elements.announcementMode.addEventListener('change', () => {
      currentSettings.announcementMode = elements.announcementMode.value;
      saveSettings();
    });
  }
  
  // Text size
  if (elements.textSize) {
    elements.textSize.addEventListener('change', () => {
      currentSettings.textSize = elements.textSize.value;
      applyTextSize();
      saveSettings();
    });
  }
  
  // High contrast mode
  if (elements.highContrast) {
    elements.highContrast.addEventListener('change', () => {
      currentSettings.highContrast = elements.highContrast.checked;
      applyContrastMode();
      saveSettings();
    });
  }
}

/**
 * Apply text size setting to document
 */
function applyTextSize() {
  document.body.classList.remove('text-normal', 'text-large', 'text-x-large');
  document.body.classList.add(`text-${currentSettings.textSize}`);
}

/**
 * Apply contrast mode setting to document
 */
function applyContrastMode() {
  if (currentSettings.highContrast) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
}

/**
 * Get current recognition threshold
 * @returns {number} Current confidence threshold value
 */
function getRecognitionThreshold() {
  return currentSettings.confidenceThreshold;
}

/**
 * Get current announcement mode
 * @returns {string} Current announcement mode
 */
function getAnnouncementMode() {
  return currentSettings.announcementMode;
}

/**
 * Get current text size setting
 * @returns {string} Current text size
 */
function getTextSize() {
  return currentSettings.textSize;
}

/**
 * Get current high contrast setting
 * @returns {boolean} Whether high contrast is enabled
 */
function getHighContrast() {
  return currentSettings.highContrast;
}

// Export the module functions
module.exports = {
  init,
  applySettings,
  getRecognitionThreshold,
  getAnnouncementMode,
  getTextSize,
  getHighContrast
};