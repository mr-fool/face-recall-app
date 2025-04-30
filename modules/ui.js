/**
 * ui.js - User interface interaction module
 * 
 * This module handles all UI elements, event listeners, and UI updates
 */

// Debug helper
function logDebug(message) {
  console.log(`[UI] ${message}`);
}

// UI Elements cache
let elements = {};

/**
 * Initialize the UI module
 */
function init() {
  logDebug('Initializing UI module');
  
  // Cache DOM elements
  cacheElements();
  
  // Setup tab navigation
  setupTabNavigation();
  
  // Setup voice test button
  setupVoiceTest();
  
  logDebug('UI module initialized');
}

/**
 * Cache DOM elements for future use
 */
function cacheElements() {
  // Camera elements
  elements.cameraView = document.getElementById('camera-view');
  elements.cameraOverlay = document.getElementById('camera-overlay');
  elements.toggleCameraButton = document.getElementById('toggle-camera');
  elements.takePhotoButton = document.getElementById('take-photo');
  elements.loadingIndicator = document.getElementById('loading-indicator');
  elements.recognitionDisplay = document.getElementById('recognition-display');
  elements.noRecognition = document.getElementById('no-recognition');
  elements.personName = document.getElementById('person-name');
  elements.personRelation = document.getElementById('person-relation');
  elements.personNotes = document.getElementById('person-notes');
  elements.recognitionConfidence = document.getElementById('recognition-confidence');
  elements.personPhoto = document.getElementById('person-photo');
  elements.personAge = document.getElementById('person-age');

  // Tab navigation
  elements.tabButtons = document.querySelectorAll('.tab-button');
  elements.tabPanels = document.querySelectorAll('.tab-panel');

  // Form elements
  elements.addPersonForm = document.getElementById('add-person-form');
  elements.personNameInput = document.getElementById('person-name-input');
  elements.personRelationshipInput = document.getElementById('person-relationship-input');
  elements.personNotesInput = document.getElementById('person-notes-input');
  elements.selectPhotosButton = document.getElementById('select-photos-button');
  elements.photoPreviewContainer = document.getElementById('photo-preview-container');
  elements.peopleList = document.getElementById('people-list');

  // Settings elements
  elements.confidenceThreshold = document.getElementById('confidence-threshold');
  elements.confidenceThresholdValue = document.getElementById('confidence-threshold-value');
  elements.announcementMode = document.getElementById('announcement-mode');
  elements.textSize = document.getElementById('text-size');
  elements.highContrast = document.getElementById('high-contrast');
  elements.exportDataButton = document.getElementById('export-data');
  elements.importDataButton = document.getElementById('import-data');
  elements.clearDataButton = document.getElementById('clear-data');
  
  // Voice settings elements
  elements.voiceSelect = document.getElementById('voice-select');
  elements.voicePitch = document.getElementById('voice-pitch');
  elements.voicePitchValue = document.getElementById('voice-pitch-value');
  elements.voiceRate = document.getElementById('voice-rate');
  elements.voiceRateValue = document.getElementById('voice-rate-value');
  elements.testVoiceButton = document.getElementById('test-voice');
}

/**
 * Setup test voice functionality
 */
function setupVoiceTest() {
  if (elements.testVoiceButton) {
    elements.testVoiceButton.addEventListener('click', () => {
      const recognition = require('./recognition');
      const settings = require('./settings');
      
      if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance();
        speech.text = "Hello, this is a test of the voice settings for FaceRecall.";
        
        // Get voice settings
        const voices = recognition.getAvailableVoices();
        const preferredVoiceName = settings.getPreferredVoice();
        
        if (preferredVoiceName && voices.length > 0) {
          const selectedVoice = voices.find(voice => voice.name === preferredVoiceName);
          if (selectedVoice) {
            speech.voice = selectedVoice;
          }
        }
        
        // Apply pitch and rate
        speech.pitch = settings.getVoicePitch();
        speech.rate = settings.getVoiceRate();
        
        window.speechSynthesis.speak(speech);
      } else {
        alert("Speech synthesis is not supported in your browser.");
      }
    });
  }
}

/**
 * Setup tab navigation
 */
function setupTabNavigation() {
  logDebug('Setting up tab navigation');
  
  elements.tabButtons.forEach(button => {
    button.addEventListener('click', (event) => {
      // Prevent default button behavior
      event.preventDefault();
      
      // Get tab name
      const tabName = button.getAttribute('data-tab');
      logDebug(`Tab clicked: ${tabName}`);
      
      // Remove active class from all tabs
      elements.tabButtons.forEach(btn => btn.classList.remove('active'));
      elements.tabPanels.forEach(panel => panel.classList.remove('active'));
      
      // Add active class to clicked tab
      button.classList.add('active');
      const targetPanel = document.getElementById(tabName);
      if (targetPanel) {
        targetPanel.classList.add('active');
      } else {
        console.error(`Tab panel with id ${tabName} not found`);
      }
      
      // Emit tab change event
      document.dispatchEvent(new CustomEvent('tab-changed', { 
        detail: { tabName } 
      }));
    });
  });
}

/**
 * Get data from the person form
 * @returns {Object} Person data from the form
 */
function getPersonFormData() {
  return {
    name: elements.personNameInput.value.trim(),
    relationship: elements.personRelationshipInput.value.trim(),
    notes: elements.personNotesInput.value.trim(),
  };
}

/**
 * Display recognition results
 * @param {Object} result - Recognition result data
 */
function displayRecognitionResult(result) {
  if (result.recognized) {
    const person = result.person;
    
    // Hide loading and no recognition displays
    elements.loadingIndicator.classList.add('hidden');
    elements.noRecognition.classList.add('hidden');
    
    // Show recognition display
    elements.recognitionDisplay.classList.remove('hidden');
    
    // Update display with person data
    elements.personName.textContent = person.name;
    elements.personRelation.textContent = person.relationship || 'No relationship specified';
    elements.personNotes.textContent = person.notes || 'No additional notes';
    
    // Show confidence level
    const confidence = Math.round(result.confidence * 100);
    elements.recognitionConfidence.textContent = `Confidence: ${confidence}%`;
    
    // Display age information if available
    let ageText = '';
    if (result.ageResult) {
      ageText = `Estimated age: ${result.ageResult.age} years`;
    } else if (person.detectedAge) {
      ageText = `Estimated age: ${person.detectedAge} years`;
    }
    
    // Check if person-age element exists, if not create it
    if (!elements.personAge) {
      // Create age element if it doesn't exist
      elements.personAge = document.createElement('p');
      elements.personAge.id = 'person-age';
      elements.personAge.className = 'person-age';
      
      // Insert after confidence
      if (elements.recognitionConfidence.parentNode) {
        elements.recognitionConfidence.parentNode.insertBefore(
          elements.personAge, 
          elements.recognitionConfidence.nextSibling
        );
      }
    }
    
    // Update age text and visibility
    if (ageText) {
      elements.personAge.textContent = ageText;
      elements.personAge.classList.remove('hidden');
    } else {
      elements.personAge.classList.add('hidden');
    }
    
    // If person has images saved, show the first one
    if (person.images && person.images.length > 0) {
      elements.personPhoto.src = person.images[0];
    } else {
      elements.personPhoto.src = 'assets/images/default-avatar.png';
    }
    
    // Draw face box on overlay if detection provided
    if (result.detection && elements.cameraOverlay) {
      const ctx = elements.cameraOverlay.getContext('2d');
      ctx.clearRect(0, 0, elements.cameraOverlay.width, elements.cameraOverlay.height);
      
      // Draw face box
      const box = result.detection.box;
      ctx.strokeStyle = '#00ff00';
      ctx.lineWidth = 3;
      ctx.strokeRect(box.x, box.y, box.width, box.height);
      
      // Add label with name and age if available
      ctx.font = '24px Arial';
      ctx.fillStyle = '#00ff00';
      
      let labelText = person.name;
      if (result.ageResult) {
        labelText += ` (${result.ageResult.age}y)`;
      } else if (person.detectedAge) {
        labelText += ` (${person.detectedAge}y)`;
      }
      
      ctx.fillText(labelText, box.x, box.y - 10);
    }
  } else {
    // Hide loading and recognition displays
    elements.loadingIndicator.classList.add('hidden');
    elements.recognitionDisplay.classList.add('hidden');
    
    // Show no recognition display
    elements.noRecognition.classList.remove('hidden');
    
    // If age was detected but person not recognized, show age
    if (result.ageResult) {
      const ageMessageElement = document.createElement('p');
      ageMessageElement.textContent = `Estimated age: ${result.ageResult.age} years old`;
      elements.noRecognition.appendChild(ageMessageElement);
    }
  }
}

/**
 * Show loading indicator for recognition
 */
function showRecognitionLoading() {
  elements.recognitionDisplay.classList.add('hidden');
  elements.noRecognition.classList.add('hidden');
  elements.loadingIndicator.classList.remove('hidden');
}

/**
 * Display people list
 * @param {Array} people - List of people to display
 */
function displayPeopleList(people) {
  if (!elements.peopleList) return;
  
  elements.peopleList.innerHTML = '';
  
  if (people.length === 0) {
    elements.peopleList.innerHTML = '<p class="empty-list">No people saved yet. Add someone to get started.</p>';
    return;
  }
  
  people.forEach(person => {
    const personElement = document.createElement('div');
    personElement.className = 'person-list-item';
    
    // Person image
    const image = document.createElement('img');
    image.src = person.images && person.images.length > 0 
      ? person.images[0] 
      : 'assets/images/default-avatar.png';
    image.alt = person.name;
    
    // Person details
    const details = document.createElement('div');
    details.className = 'person-list-details';
    
    const name = document.createElement('h3');
    name.textContent = person.name;
    
    const relationship = document.createElement('p');
    relationship.textContent = person.relationship || 'No relationship specified';
    
    // Add age display if available
    if (person.detectedAge) {
      const age = document.createElement('p');
      age.className = 'person-age';
      age.textContent = `Estimated age: ${person.detectedAge} years`;
      details.appendChild(age);
    }
    
    const lastSeen = document.createElement('p');
    lastSeen.className = 'last-seen';
    lastSeen.textContent = person.lastRecognized 
      ? `Last seen: ${new Date(person.lastRecognized).toLocaleString()}` 
      : 'Never seen';
    
    // Action buttons
    const actions = document.createElement('div');
    actions.className = 'person-list-actions';
    
    const editButton = document.createElement('button');
    editButton.textContent = 'Edit';
    editButton.className = 'edit-button';
    editButton.dataset.personId = person._id;
    editButton.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('edit-person', { 
        detail: { personId: person._id }
      }));
    });
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.dataset.personId = person._id;
    deleteButton.addEventListener('click', () => {
      document.dispatchEvent(new CustomEvent('delete-person', { 
        detail: { personId: person._id }
      }));
    });
    
    // Assemble elements
    details.appendChild(name);
    details.appendChild(relationship);
    details.appendChild(lastSeen);
    
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    
    personElement.appendChild(image);
    personElement.appendChild(details);
    personElement.appendChild(actions);
    
    elements.peopleList.appendChild(personElement);
  });
}

/**
 * Display photo previews
 * @param {Array} photos - Array of photo data objects
 */
function displayPhotoPreview(photos) {
  if (!elements.photoPreviewContainer) return;
  
  // Clear previous previews
  elements.photoPreviewContainer.innerHTML = '';
  
  photos.forEach(photo => {
    const previewContainer = document.createElement('div');
    previewContainer.className = `photo-preview ${photo.valid ? 'valid' : 'invalid'}`;
    
    const preview = document.createElement('img');
    preview.src = photo.path;
    preview.alt = 'Selected photo';
    
    // Add age information if available
    let statusText = photo.valid ? 'Face detected' : photo.error || 'No face detected';
    
    if (photo.valid && photo.ageResult) {
      statusText += ` (Age: ~${photo.ageResult.age} years)`;
    }
    
    const statusElement = document.createElement('span');
    statusElement.className = `status-text ${photo.valid ? 'success' : 'error'}`;
    statusElement.textContent = statusText;
    
    previewContainer.appendChild(preview);
    previewContainer.appendChild(statusElement);
    elements.photoPreviewContainer.appendChild(previewContainer);
  });
}

/**
 * Reset the add person form
 */
function resetPersonForm() {
  if (elements.addPersonForm) {
    elements.addPersonForm.reset();
  }
  
  if (elements.photoPreviewContainer) {
    elements.photoPreviewContainer.innerHTML = '';
  }
}

/**
 * Populate person form for editing
 * @param {Object} person - Person data to populate the form with
 */
function populatePersonForm(person) {
  if (!person) return;
  
  elements.personNameInput.value = person.name;
  elements.personRelationshipInput.value = person.relationship || '';
  elements.personNotesInput.value = person.notes || '';
  
  // Scroll to form
  elements.addPersonForm.scrollIntoView({ behavior: 'smooth' });
}

/**
 * Get all UI elements
 * @returns {Object} All cached UI elements
 */
function getElements() {
  return elements;
}

/**
 * Update camera UI state
 * @param {boolean} isActive - Whether camera is active
 */
function updateCameraUI(isActive) {
  if (elements.toggleCameraButton) {
    elements.toggleCameraButton.textContent = isActive ? 'Stop Camera' : 'Start Camera';
  }
  
  if (elements.takePhotoButton) {
    elements.takePhotoButton.disabled = !isActive;
  }
}

/**
 * Set camera stream source
 * @param {MediaStream} stream - Camera media stream
 */
function setCameraSource(stream) {
  if (elements.cameraView) {
    elements.cameraView.srcObject = stream;
  }
}

/**
 * Initialize camera overlay canvas
 * @param {number} width - Width of overlay canvas
 * @param {number} height - Height of overlay canvas
 */
function initCameraOverlay(width, height) {
  if (elements.cameraOverlay) {
    elements.cameraOverlay.width = width;
    elements.cameraOverlay.height = height;
  }
}

// Export the module functions
module.exports = {
  init,
  getElements,
  getPersonFormData,
  displayRecognitionResult,
  showRecognitionLoading,
  displayPeopleList,
  displayPhotoPreview,
  resetPersonForm,
  populatePersonForm,
  updateCameraUI,
  setCameraSource,
  initCameraOverlay
};