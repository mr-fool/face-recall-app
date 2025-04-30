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
  preferredVoice: null,  // Add this line for voice settings
  voicePitch: 1.2,       // Add this line for voice pitch
  voiceRate: 0.9,        // Add this line for voice rate
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
  
  // Apply voice settings
  if (elements.voiceSelect && elements.voiceSelect.options.length === 0) {
    const recognition = require('./recognition');
    const voices = recognition.getAvailableVoices();
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Voice';
    elements.voiceSelect.appendChild(defaultOption);
    
    // Add available voices
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      option.textContent = `${voice.name} (${voice.lang})`;
      elements.voiceSelect.appendChild(option);
    });
    
    // Set selected voice
    if (currentSettings.preferredVoice) {
      elements.voiceSelect.value = currentSettings.preferredVoice;
    }
  }
  
  // Apply voice pitch
  if (elements.voicePitch) {
    elements.voicePitch.value = currentSettings.voicePitch;
    if (elements.voicePitchValue) {
      elements.voicePitchValue.textContent = currentSettings.voicePitch;
    }
  }
  
  // Apply voice rate
  if (elements.voiceRate) {
    elements.voiceRate.value = currentSettings.voiceRate;
    if (elements.voiceRateValue) {
      elements.voiceRateValue.textContent = currentSettings.voiceRate;
    }
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
  
  // Voice selection
  if (elements.voiceSelect) {
    elements.voiceSelect.addEventListener('change', () => {
      currentSettings.preferredVoice = elements.voiceSelect.value;
      saveSettings();
    });
  }
  
  // Voice pitch
  if (elements.voicePitch) {
    elements.voicePitch.addEventListener('input', () => {
      currentSettings.voicePitch = parseFloat(elements.voicePitch.value);
      if (elements.voicePitchValue) {
        elements.voicePitchValue.textContent = elements.voicePitch.value;
      }
      saveSettings();
    });
  }
  
  // Voice rate
  if (elements.voiceRate) {
    elements.voiceRate.addEventListener('input', () => {
      currentSettings.voiceRate = parseFloat(elements.voiceRate.value);
      if (elements.voiceRateValue) {
        elements.voiceRateValue.textContent = elements.voiceRate.value;
      }
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
 * Get current preferred voice
 * @returns {string} Current preferred voice name
 */
function getPreferredVoice() {
  return currentSettings.preferredVoice;
}

/**
 * Get current voice pitch
 * @returns {number} Current voice pitch
 */
function getVoicePitch() {
  return currentSettings.voicePitch;
}

/**
 * Get current voice rate
 * @returns {number} Current voice rate
 */
function getVoiceRate() {
  return currentSettings.voiceRate;
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

function onVoicesLoaded() {
  logDebug('Voices loaded notification received');
  
  // Repopulate the voice dropdown
  const elements = ui.getElements();
  if (elements.voiceSelect) {
    const recognition = require('./recognition');
    const voices = recognition.getAvailableVoices();
    
    // Clear existing options first
    elements.voiceSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = 'Default Voice';
    elements.voiceSelect.appendChild(defaultOption);
    
    // Add available voices
    voices.forEach(voice => {
      const option = document.createElement('option');
      option.value = voice.name;
      // Add (Female) label for easier identification
      const isFemale = voice.name.toLowerCase().match(/(female|woman|girl|zira|samantha|karen|tessa|monica|victoria|allison|ava|susan|kathy|fiona|alex|anna)/);
      option.textContent = `${voice.name} (${voice.lang})${isFemale ? ' - Female' : ''}`;
      elements.voiceSelect.appendChild(option);
    });
    
    // Set selected voice
    if (currentSettings.preferredVoice) {
      elements.voiceSelect.value = currentSettings.preferredVoice;
    }
    
    logDebug(`Populated voice select with ${voices.length} voices`);
  }
}

// Export the module functions
module.exports = {
  init,
  applySettings,
  getRecognitionThreshold,
  getAnnouncementMode,
  getPreferredVoice,
  getVoicePitch,
  getVoiceRate,
  getTextSize,
  getHighContrast,
  onVoicesLoaded  // Add this new function to the exports
};