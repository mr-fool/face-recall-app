/**
 * recognition.js - Face recognition module
 * 
 * This module handles face detection, recognition, and processing
 */

// Module dependencies
const path = require('path');
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

/**
 * Initialize the recognition module
 * @param {Object} peopleModuleRef - Reference to the people module
 */
function init(peopleModuleRef) {
  logDebug('Initializing recognition module');
  
  // Store reference to people module
  peopleModule = peopleModuleRef;
  
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
    
    // Load image and wait for it
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = imagePath;
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
    
    window.speechSynthesis.speak(speech);
  }
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

// Export the module functions
module.exports = {
  init,
  recognizeFace,
  getFaceDescriptor,
  loadFaceRecognitionModels,
  isActive,
  isModelsLoaded
};