const { ipcRenderer } = require('electron');
const faceapi = require('face-api.js');
const path = require('path');
const fs = require('fs');
const database = require('./modules/database');

// DOM Elements
const cameraView = document.getElementById('camera-view');
const cameraOverlay = document.getElementById('camera-overlay');
const toggleCameraButton = document.getElementById('toggle-camera');
const takePhotoButton = document.getElementById('take-photo');
const loadingIndicator = document.getElementById('loading-indicator');
const recognitionDisplay = document.getElementById('recognition-display');
const noRecognition = document.getElementById('no-recognition');
const personName = document.getElementById('person-name');
const personRelation = document.getElementById('person-relation');
const personNotes = document.getElementById('person-notes');
const recognitionConfidence = document.getElementById('recognition-confidence');
const personPhoto = document.getElementById('person-photo');

// Tab navigation
const tabButtons = document.querySelectorAll('.tab-button');
const tabPanels = document.querySelectorAll('.tab-panel');

// Form elements
const addPersonForm = document.getElementById('add-person-form');
const personNameInput = document.getElementById('person-name-input');
const personRelationshipInput = document.getElementById('person-relationship-input');
const personNotesInput = document.getElementById('person-notes-input');
const selectPhotosButton = document.getElementById('select-photos-button');
const photoPreviewContainer = document.getElementById('photo-preview-container');
const peopleList = document.getElementById('people-list');

// Settings elements
const confidenceThreshold = document.getElementById('confidence-threshold');
const confidenceThresholdValue = document.getElementById('confidence-threshold-value');
const announcementMode = document.getElementById('announcement-mode');
const textSize = document.getElementById('text-size');
const highContrast = document.getElementById('high-contrast');
const exportDataButton = document.getElementById('export-data');
const importDataButton = document.getElementById('import-data');
const clearDataButton = document.getElementById('clear-data');

// Camera stream
let cameraStream = null;
let isCameraActive = false;

// Face recognition variables
let recognitionActive = false;
let knownPeople = [];
let selectedPhotos = [];
let faceDescriptors = [];

// Load Models
async function loadFaceRecognitionModels() {
  try {
    await faceapi.nets.ssdMobilenetv1.load('/assets/models');
    await faceapi.nets.faceLandmark68Net.load('/assets/models');
    await faceapi.nets.faceRecognitionNet.load('/assets/models');
    await faceapi.nets.faceExpressionNet.load('/assets/models');
    console.log('Face recognition models loaded');
  } catch (error) {
    console.error('Error loading face recognition models:', error);
  }
}

// Initialize app
async function init() {
  await loadFaceRecognitionModels();
  loadSavedPeople();
  setupEventListeners();
  applySettings();
}

// Setup event listeners
function setupEventListeners() {
  // Tab navigation
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabPanels.forEach(panel => panel.classList.remove('active'));
      
      button.classList.add('active');
      document.getElementById(tabName).classList.add('active');
      
      // Stop camera when switching away from recognize tab
      if (tabName !== 'recognize' && isCameraActive) {
        stopCamera();
      }
    });
  });
  
  // Camera controls
  toggleCameraButton.addEventListener('click', toggleCamera);
  takePhotoButton.addEventListener('click', recognizeFace);
  
  // Form controls
  selectPhotosButton.addEventListener('click', selectPhotos);
  addPersonForm.addEventListener('submit', savePerson);
  
  // Settings controls
  confidenceThreshold.addEventListener('input', () => {
    confidenceThresholdValue.textContent = confidenceThreshold.value;
    saveSettings();
  });
  
  announcementMode.addEventListener('change', saveSettings);
  textSize.addEventListener('change', () => {
    applyTextSize();
    saveSettings();
  });
  
  highContrast.addEventListener('change', () => {
    applyContrastMode();
    saveSettings();
  });
  
  exportDataButton.addEventListener('click', exportData);
  importDataButton.addEventListener('click', importData);
  clearDataButton.addEventListener('click', clearData);
}

// Camera Functions
// Replace your existing toggleCamera function with this one
async function toggleCamera() {
  console.log("Toggle camera button clicked");
  
  if (isCameraActive) {
    console.log("Stopping camera");
    stopCamera();
  } else {
    console.log("Starting camera - debugging version");
    
    // First, check if media devices API is available
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error("MediaDevices API not available");
      alert("Your browser doesn't support camera access. Try updating your browser.");
      return;
    }
    
    try {
      console.log("Listing available media devices:");
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log("Available video devices:", videoDevices);
      
      if (videoDevices.length === 0) {
        console.warn("No video devices found!");
        alert("No cameras detected on your system. Please connect a webcam.");
        
        // Add fallback for testing without camera
        const useFallback = confirm("Would you like to use a test image instead for debugging?");
        if (useFallback) {
          enableTestMode();
        }
        return;
      }
      
      // Try with more permissive constraints
      console.log("Requesting camera with basic constraints");
      cameraStream = await navigator.mediaDevices.getUserMedia({ 
        video: true,
        audio: false
      });
      
      console.log("Camera access granted", cameraStream);
      cameraView.srcObject = cameraStream;
      
      // Make sure video is playing
      cameraView.onloadedmetadata = () => {
        console.log("Video metadata loaded, playing video");
        cameraView.play().catch(e => console.error("Error playing video:", e));
      };
      
      isCameraActive = true;
      toggleCameraButton.textContent = 'Stop Camera';
      takePhotoButton.disabled = false;
      
      console.log("Camera setup complete");
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
}

// Add test mode functionality
function enableTestMode() {
  console.log("Enabling test mode");
  
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
    toggleCameraButton.textContent = 'Stop Test';
    takePhotoButton.disabled = false;
    
    alert('Test mode activated. You can click "Recognize Face" to test the recognition feature.');
  };
  
  img.onerror = function() {
    console.error("Failed to load test image");
    alert("Could not load test image. Please make sure assets/images/default-avatar.jpg exists.");
  };
  
  // Try to load test image
  img.src = 'assets/images/default-avatar.jpg';
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach(track => track.stop());
    cameraView.srcObject = null;
    isCameraActive = false;
    toggleCameraButton.textContent = 'Start Camera';
    takePhotoButton.disabled = true;
  }
}

// Face Recognition Functions
async function recognizeFace() {
  if (!isCameraActive || recognitionActive) return;
  
  recognitionActive = true;
  loadingIndicator.classList.remove('hidden');
  recognitionDisplay.classList.add('hidden');
  noRecognition.classList.add('hidden');
  
  try {
    // Take a screenshot from the video
    const canvas = document.createElement('canvas');
    canvas.width = cameraView.videoWidth;
    canvas.height = cameraView.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(cameraView, 0, 0, canvas.width, canvas.height);
    
    // Convert to blob for face-api.js
    const blob = await new Promise(resolve => {
      canvas.toBlob(resolve, 'image/jpeg');
    });
    
    // Load image
    const img = await faceapi.bufferToImage(blob);
    
    // Detect faces
    const detections = await faceapi.detectAllFaces(img)
      .withFaceLandmarks()
      .withFaceDescriptors()
      .withFaceExpressions();
    
    if (detections.length === 0) {
      loadingIndicator.classList.add('hidden');
      noRecognition.classList.remove('hidden');
      recognitionActive = false;
      return;
    }
    
    // Get the first detected face (we can only recognize one person at a time in this UI)
    const detection = detections[0];
    
    // Create face matcher with known faces
    const labeledDescriptors = knownPeople.map(person => {
      return new faceapi.LabeledFaceDescriptors(
        person._id,
        [new Float32Array(person.faceDescriptor)]
      );
    });
    
    const threshold = parseFloat(confidenceThreshold.value);
    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, threshold);
    
    // Find best match
    const match = faceMatcher.findBestMatch(detection.descriptor);
    
    // Display results
    if (match.label !== 'unknown') {
      const person = knownPeople.find(p => p._id === match.label);
      
      personName.textContent = person.name;
      personRelation.textContent = person.relationship || 'No relationship specified';
      personNotes.textContent = person.notes || 'No additional notes';
      
      // Show confidence level
      const confidence = Math.round(match.distance * 100);
      recognitionConfidence.textContent = `Confidence: ${confidence}%`;
      
      // If person has images saved, show the first one
      if (person.images && person.images.length > 0) {
        personPhoto.src = person.images[0];
      } else {
        personPhoto.src = 'assets/images/default-avatar.png';
      }
      
      // Update last recognized timestamp in database
      database.updateLastRecognized(person._id);
      
      // Announce recognition based on settings
      announceRecognition(person);
      
      recognitionDisplay.classList.remove('hidden');
    } else {
      noRecognition.classList.remove('hidden');
    }
    
    // Draw face box on overlay
    const ctx = cameraOverlay.getContext('2d');
    ctx.clearRect(0, 0, cameraOverlay.width, cameraOverlay.height);
    
    // Draw face box
    const box = detection.detection.box;
    ctx.strokeStyle = match.label !== 'unknown' ? '#00ff00' : '#ff0000';
    ctx.lineWidth = 3;
    ctx.strokeRect(box.x, box.y, box.width, box.height);
    
    // Add label
    ctx.font = '24px Arial';
    ctx.fillStyle = match.label !== 'unknown' ? '#00ff00' : '#ff0000';
    ctx.fillText(
      match.label !== 'unknown' ? knownPeople.find(p => p._id === match.label).name : 'Unknown', 
      box.x, 
      box.y - 10
    );
  } catch (error) {
    console.error('Error during face recognition:', error);
    noRecognition.classList.remove('hidden');
  } finally {
    loadingIndicator.classList.add('hidden');
    recognitionActive = false;
  }
}

// Announce recognition based on settings
function announceRecognition(person) {
  const mode = announcementMode.value;
  
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

// Person Management Functions
async function loadSavedPeople() {
  try {
    knownPeople = await database.getAllPeople();
    updatePeopleList();
  } catch (error) {
    console.error('Error loading saved people:', error);
  }
}

function updatePeopleList() {
  peopleList.innerHTML = '';
  
  if (knownPeople.length === 0) {
    peopleList.innerHTML = '<p class="empty-list">No people saved yet. Add someone to get started.</p>';
    return;
  }
  
  knownPeople.forEach(person => {
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
    editButton.addEventListener('click', () => editPerson(person));
    
    const deleteButton = document.createElement('button');
    deleteButton.textContent = 'Delete';
    deleteButton.className = 'delete-button';
    deleteButton.addEventListener('click', () => deletePerson(person));
    
    // Assemble elements
    details.appendChild(name);
    details.appendChild(relationship);
    details.appendChild(lastSeen);
    
    actions.appendChild(editButton);
    actions.appendChild(deleteButton);
    
    personElement.appendChild(image);
    personElement.appendChild(details);
    personElement.appendChild(actions);
    
    peopleList.appendChild(personElement);
  });
}

async function selectPhotos() {
  try {
    const filePaths = await ipcRenderer.invoke('select-photos');
    
    if (filePaths.length > 0) {
      selectedPhotos = filePaths;
      
      // Clear previous previews
      photoPreviewContainer.innerHTML = '';
      
      // Process each selected photo
      for (const filePath of selectedPhotos) {
        try {
          // Create preview
          const previewContainer = document.createElement('div');
          previewContainer.className = 'photo-preview';
          
          const preview = document.createElement('img');
          preview.src = filePath;
          preview.alt = 'Selected photo';
          
          // Process face detection for each image
          const img = await faceapi.bufferToImage(fs.readFileSync(filePath));
          const detections = await faceapi.detectSingleFace(img)
            .withFaceLandmarks()
            .withFaceDescriptors();
          
          if (detections) {
            previewContainer.classList.add('valid');
            faceDescriptors.push({
              path: filePath,
              descriptor: Array.from(detections.descriptor)
            });
            
            const statusText = document.createElement('span');
            statusText.className = 'status-text success';
            statusText.textContent = 'Face detected';
            previewContainer.appendChild(statusText);
          } else {
            previewContainer.classList.add('invalid');
            
            const statusText = document.createElement('span');
            statusText.className = 'status-text error';
            statusText.textContent = 'No face detected';
            previewContainer.appendChild(statusText);
          }
          
          previewContainer.appendChild(preview);
          photoPreviewContainer.appendChild(previewContainer);
        } catch (error) {
          console.error(`Error processing image ${filePath}:`, error);
          
          const errorContainer = document.createElement('div');
          errorContainer.className = 'photo-preview invalid';
          
          const errorImg = document.createElement('img');
          errorImg.src = filePath;
          errorImg.alt = 'Error in image';
          
          const statusText = document.createElement('span');
          statusText.className = 'status-text error';
          statusText.textContent = 'Error: ' + error.message;
          
          errorContainer.appendChild(errorImg);
          errorContainer.appendChild(statusText);
          photoPreviewContainer.appendChild(errorContainer);
        }
      }
    }
  } catch (error) {
    console.error('Error selecting photos:', error);
  }
}

async function savePerson(event) {
  event.preventDefault();
  
  if (personNameInput.value.trim() === '') {
    alert('Please enter a name for the person.');
    return;
  }
  
  // Check if we have at least one valid face descriptor
  if (faceDescriptors.length === 0) {
    alert('Please select at least one photo with a detectable face.');
    return;
  }
  
  // Create new person object
  const newPerson = {
    name: personNameInput.value.trim(),
    relationship: personRelationshipInput.value.trim(),
    notes: personNotesInput.value.trim(),
    faceDescriptor: faceDescriptors[0].descriptor, // Use the first face descriptor as reference
    images: faceDescriptors.map(fd => fd.path),
    createdAt: new Date(),
    lastRecognized: null
  };
  
  try {
    // Save to database
    const savedPerson = await database.addPerson(newPerson);
    
    // Update known people list
    knownPeople.push(savedPerson);
    updatePeopleList();
    
    // Reset form
    addPersonForm.reset();
    photoPreviewContainer.innerHTML = '';
    selectedPhotos = [];
    faceDescriptors = [];
    
    alert(`${newPerson.name} has been added successfully!`);
  } catch (error) {
    console.error('Error saving person:', error);
    alert('Failed to save person. Please try again.');
  }
}

async function editPerson(person) {
  // Populate form with person's data
  personNameInput.value = person.name;
  personRelationshipInput.value = person.relationship || '';
  personNotesInput.value = person.notes || '';
  
  // Show existing photos
  photoPreviewContainer.innerHTML = '';
  selectedPhotos = [...person.images];
  faceDescriptors = [{
    path: person.images[0], // Use first image as reference
    descriptor: person.faceDescriptor
  }];
  
  // Display images
  for (const imagePath of person.images) {
    const previewContainer = document.createElement('div');
    previewContainer.className = 'photo-preview valid';
    
    const preview = document.createElement('img');
    preview.src = imagePath;
    preview.alt = 'Selected photo';
    
    const statusText = document.createElement('span');
    statusText.className = 'status-text success';
    statusText.textContent = 'Existing photo';
    
    previewContainer.appendChild(preview);
    previewContainer.appendChild(statusText);
    photoPreviewContainer.appendChild(previewContainer);
  }
  
  // Modify the form to update instead of create
  const saveButton = document.getElementById('save-person-button');
  saveButton.textContent = 'Update Person';
  
  // Create temp buttons for cancel and delete
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'edit-buttons';
  
  const cancelButton = document.createElement('button');
  cancelButton.textContent = 'Cancel';
  cancelButton.type = 'button';
  cancelButton.addEventListener('click', () => {
    // Reset form to add mode
    addPersonForm.reset();
    photoPreviewContainer.innerHTML = '';
    selectedPhotos = [];
    faceDescriptors = [];
    saveButton.textContent = 'Save Person';
    buttonsContainer.remove();
  });
  
  buttonsContainer.appendChild(cancelButton);
  addPersonForm.appendChild(buttonsContainer);
  
  // Modify form submission to update instead of create
  const originalSubmitHandler = addPersonForm.onsubmit;
  addPersonForm.onsubmit = async (event) => {
    event.preventDefault();
    
    if (personNameInput.value.trim() === '') {
      alert('Please enter a name for the person.');
      return;
    }
    
    // Create updated person object
    const updatedPerson = {
      name: personNameInput.value.trim(),
      relationship: personRelationshipInput.value.trim(),
      notes: personNotesInput.value.trim(),
      images: selectedPhotos,
      // Keep original face descriptor if no new ones
      faceDescriptor: faceDescriptors.length > 0 ? faceDescriptors[0].descriptor : person.faceDescriptor
    };
    
    try {
      // Update in database
      await database.updatePerson(person._id, updatedPerson);
      
      // Update in known people list
      const index = knownPeople.findIndex(p => p._id === person._id);
      if (index !== -1) {
        knownPeople[index] = { ...knownPeople[index], ...updatedPerson };
      }
      
      updatePeopleList();
      
      // Reset form to add mode
      addPersonForm.reset();
      photoPreviewContainer.innerHTML = '';
      selectedPhotos = [];
      faceDescriptors = [];
      saveButton.textContent = 'Save Person';
      buttonsContainer.remove();
      
      // Restore original submit handler
      addPersonForm.onsubmit = originalSubmitHandler;
      
      alert(`${updatedPerson.name} has been updated successfully!`);
    } catch (error) {
      console.error('Error updating person:', error);
      alert('Failed to update person. Please try again.');
    }
  };
  
  // Scroll to form
  addPersonForm.scrollIntoView({ behavior: 'smooth' });
}

async function deletePerson(person) {
  if (confirm(`Are you sure you want to delete ${person.name} from your records?`)) {
    try {
      await database.deletePerson(person._id);
      
      // Remove from known people list
      knownPeople = knownPeople.filter(p => p._id !== person._id);
      updatePeopleList();
      
      alert(`${person.name} has been deleted.`);
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person. Please try again.');
    }
  }
}

// Settings Functions
function loadSettings() {
  const settings = JSON.parse(localStorage.getItem('faceRecallSettings') || '{}');
  
  if (settings.confidenceThreshold) {
    confidenceThreshold.value = settings.confidenceThreshold;
    confidenceThresholdValue.textContent = settings.confidenceThreshold;
  }
  
  if (settings.announcementMode) {
    announcementMode.value = settings.announcementMode;
  }
  
  if (settings.textSize) {
    textSize.value = settings.textSize;
    applyTextSize();
  }
  
  if (settings.highContrast !== undefined) {
    highContrast.checked = settings.highContrast;
    applyContrastMode();
  }
}

function saveSettings() {
  const settings = {
    confidenceThreshold: confidenceThreshold.value,
    announcementMode: announcementMode.value,
    textSize: textSize.value,
    highContrast: highContrast.checked
  };
  
  localStorage.setItem('faceRecallSettings', JSON.stringify(settings));
}

function applySettings() {
  loadSettings();
  applyTextSize();
  applyContrastMode();
}

function applyTextSize() {
  document.body.classList.remove('text-normal', 'text-large', 'text-x-large');
  document.body.classList.add(`text-${textSize.value}`);
}

function applyContrastMode() {
  if (highContrast.checked) {
    document.body.classList.add('high-contrast');
  } else {
    document.body.classList.remove('high-contrast');
  }
}

// Data Management Functions
async function exportData() {
  try {
    const people = await database.getAllPeople();
    
    const dataStr = JSON.stringify(people, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `face-recall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Data exported successfully!');
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
  }
}

async function importData() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  
  input.onchange = async (event) => {
    try {
      const file = event.target.files[0];
      if (!file) return;
      
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          if (!Array.isArray(importedData)) {
            throw new Error('Invalid data format');
          }
          
          // Clear existing data
          const clearConfirm = confirm('Importing will replace your existing people data. Continue?');
          if (!clearConfirm) return;
          
          // Clear database
          for (const person of knownPeople) {
            await database.deletePerson(person._id);
          }
          
          // Import new data
          for (const person of importedData) {
            // Remove _id to avoid conflicts
            const { _id, ...personData } = person;
            await database.addPerson(personData);
          }
          
          // Reload data
          await loadSavedPeople();
          
          alert('Data imported successfully!');
        } catch (error) {
          console.error('Error processing import file:', error);
          alert('Failed to import data: ' + error.message);
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. Please try again.');
    }
  };
  
  input.click();
}

async function clearData() {
  const confirmClear = confirm('Are you sure you want to delete ALL saved people? This cannot be undone!');
  
  if (confirmClear) {
    const confirmAgain = confirm('This will permanently delete all people data. Are you absolutely sure?');
    
    if (confirmAgain) {
      try {
        // Clear database
        for (const person of knownPeople) {
          await database.deletePerson(person._id);
        }
        
        // Clear UI
        knownPeople = [];
        updatePeopleList();
        
        alert('All data has been cleared.');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
      }
    }
  }
}

// Start the application
init();
