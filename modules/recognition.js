/**
 * recognition.js - Face recognition module
 * 
 * This module handles face detection, recognition, and processing
 */
let speechVoices = [];
let preferredVoice = null;

// Module dependencies
const path = require('path');
const fs = require('fs'); // Add this import
const ui = require('./ui');
const settings = require('./settings');

// Debug helper
function logDebug(message) {
  console.log(`[RECOGNITION] ${message}`);
}

// Recognition state
let faceapi = null;
let recognitionActive = false;
let peopleModule = null;
let modelsLoaded = false;

function initSpeechSynthesis() {
  if ('speechSynthesis' in window) {
    logDebug('Initializing speech synthesis');
    
    // Function to load and process voices
    const loadVoices = () => {
      speechVoices = window.speechSynthesis.getVoices();
      logDebug(`Loaded ${speechVoices.length} voices`);
      
      // Log all available voices for debugging
      speechVoices.forEach(voice => {
        logDebug(`Voice: ${voice.name} (${voice.lang}) - Default: ${voice.default}`);
      });
      
      // More aggressive filter for female voices - check for common patterns in various languages
      const femaleVoices = speechVoices.filter(voice => {
        const nameLower = voice.name.toLowerCase();
        return nameLower.includes('female') || 
               nameLower.includes('woman') ||
               nameLower.includes('girl') ||
               nameLower.includes('zira') ||
               nameLower.includes('samantha') ||
               nameLower.includes('karen') ||
               nameLower.includes('tessa') ||
               nameLower.includes('monica') ||
               nameLower.includes('victoria') ||
               nameLower.includes('allison') ||
               nameLower.includes('ava') ||
               nameLower.includes('susan') ||
               nameLower.includes('kathy') ||
               nameLower.includes('vicki') ||
               nameLower.includes('fiona') ||
               nameLower.includes('laura') ||
               nameLower.includes('lisa') ||
               // Common female names in voice systems
               nameLower.includes('alex') || // macOS has a female Alex voice
               nameLower.includes('alva') ||
               nameLower.includes('amelie') ||
               nameLower.includes('anna') ||
               nameLower.includes('carmit') ||
               nameLower.includes('damayanti') ||
               nameLower.includes('ellen') ||
               nameLower.includes('ioana') ||
               nameLower.includes('joana') ||
               nameLower.includes('kyoko') ||
               nameLower.includes('lekha') ||
               nameLower.includes('luca') ||
               nameLower.includes('luciana') ||
               nameLower.includes('maged') ||
               nameLower.includes('mariska') ||
               nameLower.includes('meijia') ||
               nameLower.includes('melina') ||
               nameLower.includes('milena') ||
               nameLower.includes('moira') ||
               nameLower.includes('monica') ||
               nameLower.includes('nora') ||
               nameLower.includes('paulina') ||
               nameLower.includes('samantha') ||
               nameLower.includes('sara') ||
               nameLower.includes('satu') ||
               nameLower.includes('tessa') ||
               nameLower.includes('ting-ting') ||
               nameLower.includes('veena') ||
               nameLower.includes('yuna') ||
               nameLower.includes('zosia');
      });
      
      // Log available female voices for debugging
      if (femaleVoices.length > 0) {
        logDebug(`Found ${femaleVoices.length} female voices:`);
        femaleVoices.forEach(voice => {
          logDebug(`- ${voice.name} (${voice.lang})`);
        });
        preferredVoice = femaleVoices[0];
        logDebug(`Selected voice: ${preferredVoice.name}`);
      } else {
        logDebug('No female voices found, using default voice');
        // If no female voice is found, try to use any non-default voice or just the first voice
        if (speechVoices.length > 0) {
          preferredVoice = speechVoices[0];
          logDebug(`Selected default voice: ${preferredVoice.name}`);
        }
      }
      
      // Notify settings module that voices are loaded
      const settingsModule = require('./settings');
      if (settingsModule.onVoicesLoaded) {
        settingsModule.onVoicesLoaded();
      }
    };
    
    // Chrome/Electron loads voices asynchronously
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    // Try loading voices immediately (works in Firefox)
    loadVoices();
    
    // Sometimes onvoiceschanged never fires, so we'll try again after a delay
    setTimeout(() => {
      if (speechVoices.length === 0) {
        logDebug('No voices loaded after initial attempts, trying again...');
        loadVoices();
      }
    }, 1000);
  } else {
    logDebug('Speech synthesis not supported in this browser');
  }
}
/**
 * Initialize the recognition module
 * @param {Object} peopleModuleRef - Reference to the people module
 */
function init(peopleModuleRef) {
  logDebug('Initializing recognition module');
  
  // Store reference to people module
  peopleModule = peopleModuleRef;
  
  // Initialize speech synthesis
  initSpeechSynthesis();
  
  // Delay loading face-api to avoid platform warning
  setTimeout(() => {
    try {
      faceapi = require('face-api.js');
      logDebug('Face API loaded successfully');
      
      // Now that face-api is loaded, try to load the models
      loadFaceRecognitionModels();
    } catch (error) {
      console.error('Error loading face-api.js:', error);
    }
  }, 1000);
  
  logDebug('Recognition module initialized');
}

/**
 * Load face recognition models
 * @returns {Promise<boolean>} Whether models loaded successfully
 */
async function loadFaceRecognitionModels() {
  if (!faceapi) {
    console.error('Face API not loaded yet');
    return false;
  }
  
  if (modelsLoaded) {
    logDebug('Models already loaded');
    return true;
  }
  
  try {
    // Use a try-catch to handle model loading issues
    const modelPath = path.join(__dirname, '../assets/models');
    logDebug(`Loading models from: ${modelPath}`);
    
    // Set cross-origin to anonymous to avoid CORS issues with local files
    faceapi.env.monkeyPatch({
      Canvas: HTMLCanvasElement,
      Image: HTMLImageElement,
      ImageData: ImageData,
      Video: HTMLVideoElement,
      createCanvasElement: () => document.createElement('canvas'),
      createImageElement: () => document.createElement('img')
    });
    
    await faceapi.nets.ssdMobilenetv1.load(modelPath);
    await faceapi.nets.faceLandmark68Net.load(modelPath);
    await faceapi.nets.faceRecognitionNet.load(modelPath);
    await faceapi.nets.faceExpressionNet.load(modelPath);
    
    logDebug('Face recognition models loaded successfully');
    modelsLoaded = true;
    return true;
  } catch (error) {
    console.error('Error loading face recognition models:', error);
    return false;
  }
}

/**
 * Recognize face from image data
 * @param {Object} imageData - Image data object with canvas and context
 */
async function recognizeFace(imageData) {
  if (recognitionActive || !faceapi || !modelsLoaded) {
    logDebug('Cannot recognize face: Recognition in progress or models not loaded');
    return;
  }
  
  recognitionActive = true;
  ui.showRecognitionLoading();
  
  try {
    // Make sure models are loaded
    if (!modelsLoaded) {
      await loadFaceRecognitionModels();
    }
    
    // Convert canvas to blob for face-api.js
    const blob = await new Promise(resolve => {
      imageData.canvas.toBlob(resolve, 'image/jpeg');
    });
    
    // Load image from blob
    const img = await faceapi.bufferToImage(blob);
    
    // Detect faces with all features
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();
    
    if (detections.length === 0) {
      ui.displayRecognitionResult({ recognized: false });
      recognitionActive = false;
      return;
    }
    
    // Get the most prominent detected face
    const detection = detections[0];
    
    // Get known people data
    const knownPeople = await peopleModule.getKnownPeople();
    
    if (knownPeople.length === 0) {
      ui.displayRecognitionResult({ 
        recognized: false,
        message: 'No people saved to recognize. Please add people first.'
      });
      recognitionActive = false;
      return;
    }
    
    // Create face matcher with known faces
    const labeledDescriptors = knownPeople.map(person => {
      return new faceapi.LabeledFaceDescriptors(
        person._id,
        [new Float32Array(person.faceDescriptor)]
      );
    });
    
    // Get threshold from settings
    const threshold = parseFloat(settings.getRecognitionThreshold());
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);
    
    // Find best match
    const match = faceMatcher.findBestMatch(detection.descriptor);
    
    // Display results
    if (match.label !== 'unknown') {
      const person = knownPeople.find(p => p._id === match.label);
      
      // Update last recognized timestamp in database
      peopleModule.updateLastRecognized(person._id);
      
      // Announce recognition based on settings
      announceRecognition(person);
      
      // Display results in UI
      ui.displayRecognitionResult({
        recognized: true,
        person: person,
        confidence: match.distance,
        detection: detection.detection
      });
    } else {
      ui.displayRecognitionResult({ 
        recognized: false,
        message: 'Face not recognized. Try adding this person first.'
      });
    }
  } catch (error) {
    console.error('Error during face recognition:', error);
    ui.displayRecognitionResult({ 
      recognized: false,
      message: 'Error analyzing face: ' + error.message
    });
  } finally {
    recognitionActive = false;
  }
}

/**
 * Get face descriptor from image
 * @param {string} imagePath - Path to image file
 * @returns {Promise<Object>} Face descriptor data
 */
async function getFaceDescriptor(imagePath) {
  try {
    // Make sure models are loaded
    if (!modelsLoaded) {
      await loadFaceRecognitionModels();
    }
    
    // Create Image element
    const img = new Image();
    
    // Set crossOrigin to anonymous for local files
    img.crossOrigin = 'anonymous';
    
    // Create a data URL from the image path
    const imageData = await fs.promises.readFile(imagePath);
    const base64Image = imageData.toString('base64');
    
    // Determine the correct MIME type based on the file extension
    const extension = path.extname(imagePath).toLowerCase();
    const mimeType = extension === '.png' ? 'image/png' : 
                    (extension === '.jpg' || extension === '.jpeg') ? 'image/jpeg' : 'image/png';
    
    const dataUrl = `data:${mimeType};base64,${base64Image}`;
    
    // Load image and wait for it
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = dataUrl;
    });
    
    // Detect face in image
    const detection = await faceapi.detectSingleFace(img)
      .withFaceLandmarks()
      .withFaceDescriptor();
    
    if (detection) {
      return {
        valid: true,
        descriptor: Array.from(detection.descriptor),
        detection: detection
      };
    } else {
      return {
        valid: false,
        error: 'No face detected in image'
      };
    }
  } catch (error) {
    console.error('Error getting face descriptor:', error);
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Announce recognition based on settings
 * @param {Object} person - Recognized person data
 */
function announceRecognition(person) {
  const mode = settings.getAnnouncementMode();
  if (mode === 'none') return;
  
  if ('speechSynthesis' in window) {
    const speech = new SpeechSynthesisUtterance();
    
    if (mode === 'name') {
      speech.text = person.name;
    } else if (mode === 'full') {
      speech.text = `${person.name}, your ${person.relationship || 'contact'}. ${person.notes || ''}`;
    }
    
    // Check for user's preferred voice from settings
    const preferredVoiceName = settings.getPreferredVoice();
    
    // Ensure voices are loaded
    if (speechVoices.length === 0) {
      // Try loading voices again
      speechVoices = window.speechSynthesis.getVoices();
    }
    
    // Try to find the preferred voice
    let voiceFound = false;
    
    if (preferredVoiceName && speechVoices.length > 0) {
      // Find the voice by name
      const selectedVoice = speechVoices.find(voice => voice.name === preferredVoiceName);
      if (selectedVoice) {
        speech.voice = selectedVoice;
        voiceFound = true;
        logDebug(`Using selected voice: ${selectedVoice.name}`);
      }
    }
    
    // If no voice was found or set, try the auto-detected female voice
    if (!voiceFound && preferredVoice) {
      speech.voice = preferredVoice;
      voiceFound = true;
      logDebug(`Using detected female voice: ${preferredVoice.name}`);
    }
    
    // If still no voice, log a message
    if (!voiceFound) {
      logDebug('No specific voice selected or detected, using system default');
    }
    
    // Apply pitch and rate from settings
    speech.pitch = settings.getVoicePitch();
    speech.rate = settings.getVoiceRate();
    
    // Log the final voice configuration
    logDebug(`Speaking with voice: ${speech.voice ? speech.voice.name : 'default'}, pitch: ${speech.pitch}, rate: ${speech.rate}`);
    
    // Cancel any previous speech
    window.speechSynthesis.cancel();
    
    // Speak the text
    window.speechSynthesis.speak(speech);
  }
}
function getAvailableVoices() {
  return speechVoices;
}
/**
 * Check if recognition is currently active
 * @returns {boolean} Whether recognition is active
 */
function isActive() {
  return recognitionActive;
}

/**
 * Check if models are loaded
 * @returns {boolean} Whether models are loaded
 */
function isModelsLoaded() {
  return modelsLoaded;
}
function debugVoices() {
  console.log('=== VOICE DEBUG INFO ===');
  
  // Check if speech synthesis is supported
  if (!('speechSynthesis' in window)) {
    console.log('Speech synthesis not supported in this browser/environment');
    return;
  }
  
  // List all voices
  const allVoices = window.speechSynthesis.getVoices();
  console.log(`Total voices available: ${allVoices.length}`);
  
  if (allVoices.length === 0) {
    console.log('No voices loaded yet. Try running this function again in a few seconds.');
    // Try to force load voices
    window.speechSynthesis.cancel();
    setTimeout(() => {
      const recheck = window.speechSynthesis.getVoices();
      console.log(`After force reload: ${recheck.length} voices`);
      recheck.forEach((voice, index) => {
        console.log(`Voice ${index + 1}: ${voice.name} (${voice.lang}) - Default: ${voice.default}`);
      });
    }, 500);
    return;
  }
  
  // Log all voices
  allVoices.forEach((voice, index) => {
    console.log(`Voice ${index + 1}: ${voice.name} (${voice.lang}) - Default: ${voice.default}`);
  });
  
  // Find potential female voices
  const femalePatterns = [
    'female', 'woman', 'girl', 'zira', 'samantha', 'karen', 'tessa', 'monica', 
    'victoria', 'allison', 'ava', 'susan', 'kathy', 'fiona', 'alex', 'anna'
  ];
  
  const potentialFemaleVoices = allVoices.filter(voice => {
    const nameLower = voice.name.toLowerCase();
    return femalePatterns.some(pattern => nameLower.includes(pattern));
  });
  
  console.log(`Potential female voices: ${potentialFemaleVoices.length}`);
  potentialFemaleVoices.forEach((voice, index) => {
    console.log(`Female voice ${index + 1}: ${voice.name} (${voice.lang})`);
  });
  
  // Current preference info
  console.log(`Current preferred voice: ${preferredVoice ? preferredVoice.name : 'None'}`);
  console.log(`Settings voice name: ${settings.getPreferredVoice() || 'None'}`);
  
  // Test a voice
  console.log('Testing a voice... (should speak "Hello, this is a test")');
  const speech = new SpeechSynthesisUtterance('Hello, this is a test');
  if (preferredVoice) speech.voice = preferredVoice;
  speech.pitch = settings.getVoicePitch();
  speech.rate = settings.getVoiceRate();
  window.speechSynthesis.speak(speech);
  
  console.log('=== END VOICE DEBUG INFO ===');
  
  return {
    allVoices,
    femaleVoices: potentialFemaleVoices,
    currentPreferred: preferredVoice,
    settingsVoice: settings.getPreferredVoice()
  };
}
// Export the module functions
module.exports = {
  init,
  recognizeFace,
  getFaceDescriptor,
  loadFaceRecognitionModels,
  isActive,
  isModelsLoaded,
  getAvailableVoices,
  debugVoices
};