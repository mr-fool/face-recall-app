/**
 * people.js - People management module
 * 
 * This module handles people data, including adding, editing, 
 * deleting, and managing face recognition data.
 */

// Module dependencies
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const ui = require('./ui');
const db = require('./database');
const recognition = require('./recognition');

// Debug helper
function logDebug(message) {
  console.log(`[PEOPLE] ${message}`);
}

// People state
let knownPeople = [];
let selectedPhotos = [];
let faceDescriptors = [];
let editingPersonId = null;

/**
 * Initialize the people module
 */
async function init() {
  logDebug('Initializing people module');
  
  // Load saved people from database
  await loadSavedPeople();
  
  // Set up event listeners
  document.addEventListener('edit-person', (event) => {
    const personId = event.detail.personId;
    const person = knownPeople.find(p => p._id === personId);
    if (person) {
      editPerson(person);
    }
  });
  
  document.addEventListener('delete-person', (event) => {
    const personId = event.detail.personId;
    const person = knownPeople.find(p => p._id === personId);
    if (person) {
      deletePerson(person);
    }
  });
  
  logDebug('People module initialized');
  return true;
}

/**
 * Load saved people from database
 * @returns {Promise<boolean>} Whether loading was successful
 */
async function loadSavedPeople() {
  try {
    logDebug('Loading saved people from database...');
    knownPeople = await db.getAllPeople();
    logDebug(`Loaded ${knownPeople.length} people from database`);
    ui.displayPeopleList(knownPeople);
    return true;
  } catch (error) {
    console.error('Error loading saved people:', error);
    knownPeople = [];
    ui.displayPeopleList(knownPeople);
    return false;
  }
}

/**
 * Get list of known people
 * @returns {Array} List of known people
 */
function getKnownPeople() {
  return knownPeople;
}

/**
 * Update last recognized timestamp for a person
 * @param {string} personId - Person ID to update
 */
async function updateLastRecognized(personId) {
  try {
    await db.updateLastRecognized(personId);
    
    // Update in local list
    const index = knownPeople.findIndex(p => p._id === personId);
    if (index !== -1) {
      knownPeople[index].lastRecognized = new Date();
    }
  } catch (error) {
    console.error('Error updating last recognized timestamp:', error);
  }
}

/**
 * Select photos for a person
 * @returns {Promise<Array>} Selected photos with face detection results
 */
async function selectPhotos() {
  try {
    // Reset data
    selectedPhotos = [];
    faceDescriptors = [];
    
    // Select photos via Electron dialog
    const filePaths = await ipcRenderer.invoke('select-photos');
    
    if (filePaths.length === 0) {
      return [];
    }
    
    // Process each selected photo
    const photoResults = [];
    for (const filePath of filePaths) {
      try {
        // Store original path
        selectedPhotos.push(filePath);
        
        // Process face detection
        const result = await recognition.getFaceDescriptor(filePath);
        
        if (result.valid) {
          faceDescriptors.push({
            path: filePath,
            descriptor: result.descriptor
          });
        }
        
        // Add to results
        photoResults.push({
          path: filePath,
          valid: result.valid,
          error: result.error
        });
      } catch (error) {
        console.error(`Error processing image ${filePath}:`, error);
        photoResults.push({
          path: filePath,
          valid: false,
          error: error.message
        });
      }
    }
    
    return photoResults;
  } catch (error) {
    console.error('Error selecting photos:', error);
    alert('Error selecting photos: ' + error.message);
    return [];
  }
}

/**
 * Save a new person or update existing person
 * @param {Object} personData - Person data from form
 */
async function savePerson(personData) {
  if (personData.name.trim() === '') {
    alert('Please enter a name for the person.');
    return;
  }
  
  // Check if we have at least one valid face descriptor
  if (faceDescriptors.length === 0) {
    alert('Please select at least one photo with a detectable face.');
    return;
  }
  
  try {
    if (editingPersonId) {
      // Update existing person
      const updatedPerson = {
        name: personData.name,
        relationship: personData.relationship,
        notes: personData.notes,
        images: selectedPhotos,
        // Keep original face descriptor if no new ones
        faceDescriptor: faceDescriptors.length > 0 ? faceDescriptors[0].descriptor : null
      };
      
      await db.updatePerson(editingPersonId, updatedPerson);
      
      // Update in known people list
      const index = knownPeople.findIndex(p => p._id === editingPersonId);
      if (index !== -1) {
        knownPeople[index] = { 
          ...knownPeople[index], 
          ...updatedPerson 
        };
      }
      
      alert(`${updatedPerson.name} has been updated successfully!`);
    } else {
      // Create new person object
      const newPerson = {
        name: personData.name,
        relationship: personData.relationship,
        notes: personData.notes,
        faceDescriptor: faceDescriptors[0].descriptor, // Use the first face descriptor as reference
        images: selectedPhotos,
        createdAt: new Date(),
        lastRecognized: null
      };
      
      // Save to database
      const savedPerson = await db.addPerson(newPerson);
      
      // Update known people list
      knownPeople.push(savedPerson);
      
      alert(`${newPerson.name} has been added successfully!`);
    }
    
    // Reset form and state
    ui.resetPersonForm();
    selectedPhotos = [];
    faceDescriptors = [];
    editingPersonId = null;
    
    // Update UI
    ui.displayPeopleList(knownPeople);
    
    return true;
  } catch (error) {
    console.error('Error saving person:', error);
    alert('Failed to save person. Please try again.');
    return false;
  }
}

/**
 * Edit an existing person
 * @param {Object} person - Person data to edit
 */
function editPerson(person) {
  // Set editing state
  editingPersonId = person._id;
  
  // Populate form with existing data
  ui.populatePersonForm(person);
  
  // Set existing photos
  selectedPhotos = [...person.images];
  
  // Set existing face descriptor
  if (person.faceDescriptor) {
    faceDescriptors = [{
      path: person.images[0], // Use first image as reference
      descriptor: person.faceDescriptor
    }];
  }
  
  // Show photo previews
  const photoData = person.images.map(path => ({
    path,
    valid: true
  }));
  
  ui.displayPhotoPreview(photoData);
}

/**
 * Delete a person
 * @param {Object} person - Person to delete
 */
async function deletePerson(person) {
  if (confirm(`Are you sure you want to delete ${person.name} from your records?`)) {
    try {
      await db.deletePerson(person._id);
      
      // Remove from known people list
      knownPeople = knownPeople.filter(p => p._id !== person._id);
      ui.displayPeopleList(knownPeople);
      
      alert(`${person.name} has been deleted.`);
      return true;
    } catch (error) {
      console.error('Error deleting person:', error);
      alert('Failed to delete person. Please try again.');
      return false;
    }
  }
}

/**
 * Export people data to a JSON file
 */
async function exportData() {
  try {
    const dataStr = JSON.stringify(knownPeople, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
    
    const exportFileDefaultName = `face-recall-backup-${new Date().toISOString().slice(0, 10)}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    
    alert('Data exported successfully!');
    return true;
  } catch (error) {
    console.error('Error exporting data:', error);
    alert('Failed to export data. Please try again.');
    return false;
  }
}

/**
 * Import people data from a JSON file
 */
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
            await db.deletePerson(person._id);
          }
          
          // Import new data
          for (const person of importedData) {
            // Remove _id to avoid conflicts
            const { _id, ...personData } = person;
            await db.addPerson(personData);
          }
          
          // Reload data
          await loadSavedPeople();
          
          alert('Data imported successfully!');
          return true;
        } catch (error) {
          console.error('Error processing import file:', error);
          alert('Failed to import data: ' + error.message);
          return false;
        }
      };
      
      reader.readAsText(file);
    } catch (error) {
      console.error('Error importing data:', error);
      alert('Failed to import data. Please try again.');
      return false;
    }
  };
  
  input.click();
}

/**
 * Clear all people data
 */
async function clearData() {
  const confirmClear = confirm('Are you sure you want to delete ALL saved people? This cannot be undone!');
  
  if (confirmClear) {
    const confirmAgain = confirm('This will permanently delete all people data. Are you absolutely sure?');
    
    if (confirmAgain) {
      try {
        // Clear database
        for (const person of knownPeople) {
          await db.deletePerson(person._id);
        }
        
        // Clear UI
        knownPeople = [];
        ui.displayPeopleList(knownPeople);
        
        alert('All data has been cleared.');
        return true;
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Failed to clear data. Please try again.');
        return false;
      }
    }
  }
  
  return false;
}

// Export the module functions
module.exports = {
  init,
  getKnownPeople,
  updateLastRecognized,
  selectPhotos,
  savePerson,
  editPerson,
  deletePerson,
  exportData,
  importData,
  clearData
};