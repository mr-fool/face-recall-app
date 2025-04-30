/**
 * camera.js - Camera handling module
 * 
 * This module handles camera activation, capturing images,
 * and other camera-related operations.
 */

// Module dependencies
const { ipcRenderer } = require('electron');
const ui = require('./ui');

// Debug helper
function logDebug(message) {
  console.log(`[CAMERA] ${message}`);
}

// Camera state
let cameraStream = null;
let isCameraActive = false;
let isTestMode = false;
let cameraView = null;
let cameraOverlay = null;

/**
 * Initialize the camera module
 */
function init() {
  logDebug('Initializing camera module');
  
  // Get UI elements
  const elements = ui.getElements();
  cameraView = elements.cameraView;
  cameraOverlay = elements.cameraOverlay;
  const toggleCameraButton = elements.toggleCameraButton;
  
  // Setup event listener for camera toggle
  if (toggleCameraButton) {
    toggleCameraButton.addEventListener('click', toggleCamera);
  }
  
  // Handle tab changes to stop camera when switching away
  document.addEventListener('tab-changed', (event) => {
    if (event.detail.tabName !== 'recognize' && isCameraActive) {
      stopCamera();
    }
  });
  
  logDebug('Camera module initialized');
}

/**
 * Toggle camera state (on/off)
 */
async function toggleCamera() {
  logDebug("Toggle camera button clicked");
  
  if (isCameraActive) {
    logDebug("Stopping camera");
    stopCamera();
  } else {
    logDebug("Starting camera");
    await startCamera();
  }
}

/**
 * Start the camera
 */
async function startCamera() {
  // First, check if media devices API is available
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("MediaDevices API not available");
    alert("Your browser doesn't support camera access. Try updating your browser.");
    return;
  }
  
  try {
    logDebug("Listing available media devices:");
    const devices = await navigator.mediaDevices.enumerateDevices();
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    logDebug(`Available video devices: ${videoDevices.length}`);
    
    if (videoDevices.length === 0) {
      logDebug("No video devices found!");
      alert("No cameras detected on your system. Please connect a webcam.");
      
      // Add fallback for testing without camera
      const useFallback = confirm("Would you like to use a test image instead for debugging?");
      if (useFallback) {
        enableTestMode();
      }
      return;
    }
    
    // Try with more permissive constraints
    logDebug("Requesting camera with basic constraints");
    cameraStream = await navigator.mediaDevices.getUserMedia({ 
      video: true,
      audio: false
    });
    
    logDebug("Camera access granted");
    ui.setCameraSource(cameraStream);
    
    // Make sure video is playing
    cameraView.onloadedmetadata = () => {
      logDebug("Video metadata loaded, playing video");
      cameraView.play().catch(e => console.error("Error playing video:", e));
      
      // Setup camera overlay for drawing face boxes
      if (cameraOverlay) {
        ui.initCameraOverlay(cameraView.videoWidth || 640, cameraView.videoHeight || 480);
      }
    };
    
    isCameraActive = true;
    isTestMode = false;
    ui.updateCameraUI(true);
    
    logDebug("Camera setup complete");
  } catch (error) {
    console.error('Error accessing camera:', error);
    alert('Could not access the camera: ' + error.message);
    
    // Offer test mode
    const useFallback = confirm("Would you like to use a test image instead for debugging?");
    if (useFallback) {
      enableTestMode();
    }
  }
}

/**
 * Enable test mode with a static image instead of camera
 */
function enableTestMode() {
  logDebug("Enabling test mode");
  
  // Create a canvas as a mock video source
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 480;
  const ctx = canvas.getContext('2d');
  
  // Load a test image
  const img = new Image();
  img.onload = function() {
    // Draw image on canvas
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    
    // Use the canvas as our video source
    cameraView.srcObject = null;
    cameraView.src = canvas.toDataURL();
    
    // Update UI
    isCameraActive = true;
    isTestMode = true;
    ui.updateCameraUI(true);
    
    // Setup camera overlay
    if (cameraOverlay) {
      ui.initCameraOverlay(canvas.width, canvas.height);
    }
    
    alert('Test mode activated. You can click "Recognize Face" to test the recognition feature.');
  };
  
  img.onerror = function() {
    console.error("Failed to load test image");
    alert("Could not load test image. Please make sure assets/images/default-avatar.png exists.");
  };
  
  // Try to load test image
  img.src = 'assets/images/default-avatar.png';
}

/**
 * Stop the camera
 */
function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraView.srcObject = null;
    cameraStream = null;
  }
  
  if (isTestMode) {
    cameraView.src = '';
  }
  
  isCameraActive = false;
  isTestMode = false;
  ui.updateCameraUI(false);
  
  // Clear overlay
  if (cameraOverlay) {
    const ctx = cameraOverlay.getContext('2d');
    ctx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
  }
}

/**
 * Take a photo from the current camera view
 * @returns {Object} Image data object with canvas and context
 */
function takePhoto() {
  if (!isCameraActive) {
    logDebug('Cannot take photo: Camera inactive');
    return null;
  }
  
  try {
    // Create a canvas to take the screenshot
    const canvas = document.createElement('canvas');
    canvas.width = cameraView.videoWidth || cameraView.width || 640;
    canvas.height = cameraView.videoHeight || cameraView.height || 480;
    
    const context = canvas.getContext('2d');
    context.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
    
    return { canvas, context };
  } catch (error) {
    console.error('Error taking photo:', error);
    return null;
  }
}

/**
 * Check if camera is currently active
 * @returns {boolean} Whether camera is active
 */
function isActive() {
  return isCameraActive;
}

// Export the module functions
module.exports = {
  init,
  toggleCamera,
  startCamera,
  stopCamera,
  takePhoto,
  isActive
};