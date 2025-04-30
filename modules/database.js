/**
 * database.js - Database operations module
 * 
 * This module provides database operations for storing and retrieving
 * people data, using NeDB as the underlying database engine.
 */

// Module dependencies
const Datastore = require('nedb');
const path = require('path');
const fs = require('fs');

// Debug helper
function logDebug(message) {
  console.log(`[DATABASE] ${message}`);
}

// Database instance
let db = null;
let dbPath = '';
let initialized = false;

/**
 * Initialize the database with the correct user data path
 * @param {string} userDataPath - Path to user data directory
 * @returns {Promise<boolean>} Whether initialization was successful
 */
async function init(userDataPath) {
  return new Promise((resolve, reject) => {
    try {
      logDebug(`Initializing database with user data path: ${userDataPath}`);
      
      // Set database path
      dbPath = userDataPath;
      
      // Create data directory if it doesn't exist
      const dataDir = path.join(dbPath, 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Initialize the database
      const dbFilePath = path.join(dataDir, 'people.db');
      db = new Datastore({
        filename: dbFilePath,
        autoload: true
      });
      
      initialized = true;
      logDebug(`Database initialized at: ${dbFilePath}`);
      resolve(true);
    } catch (error) {
      console.error('Error initializing database:', error);
      reject(error);
    }
  });
}

/**
 * Add a new person to the database
 * @param {Object} person - Person object to add
 * @returns {Promise<Object>} Added person with ID
 */
async function addPerson(person) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.insert(person, (err, newDoc) => {
      if (err) {
        reject(err);
      } else {
        logDebug(`Added person: ${newDoc.name} (${newDoc._id})`);
        resolve(newDoc);
      }
    });
  });
}

/**
 * Get all people from the database
 * @returns {Promise<Array>} Array of all people
 */
async function getAllPeople() {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.find({}).sort({ name: 1 }).exec((err, docs) => {
      if (err) {
        reject(err);
      } else {
        logDebug(`Retrieved ${docs.length} people from database`);
        resolve(docs);
      }
    });
  });
}

/**
 * Get a person by ID
 * @param {string} id - Person ID
 * @returns {Promise<Object>} Person object
 */
async function getPersonById(id) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.findOne({ _id: id }, (err, doc) => {
      if (err) {
        reject(err);
      } else if (!doc) {
        reject(new Error(`Person with ID ${id} not found`));
      } else {
        resolve(doc);
      }
    });
  });
}

/**
 * Update a person
 * @param {string} id - Person ID
 * @param {Object} updates - Object with fields to update
 * @returns {Promise<number>} Number of updated documents
 */
async function updatePerson(id, updates) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.update({ _id: id }, { $set: updates }, {}, (err, numReplaced) => {
      if (err) {
        reject(err);
      } else {
        logDebug(`Updated ${numReplaced} people with ID ${id}`);
        resolve(numReplaced);
      }
    });
  });
}

/**
 * Delete a person
 * @param {string} id - Person ID
 * @returns {Promise<number>} Number of deleted documents
 */
async function deletePerson(id) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.remove({ _id: id }, {}, (err, numRemoved) => {
      if (err) {
        reject(err);
      } else {
        logDebug(`Deleted ${numRemoved} people with ID ${id}`);
        resolve(numRemoved);
      }
    });
  });
}

/**
 * Update last recognized timestamp
 * @param {string} id - Person ID
 * @returns {Promise<number>} Number of updated documents
 */
async function updateLastRecognized(id) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.update(
      { _id: id }, 
      { $set: { lastRecognized: new Date() } }, 
      {}, 
      (err, numReplaced) => {
        if (err) {
          reject(err);
        } else {
          logDebug(`Updated last recognized timestamp for person ${id}`);
          resolve(numReplaced);
        }
      }
    );
  });
}

/**
 * Add an image to a person
 * @param {string} id - Person ID
 * @param {string} imagePath - Path to image
 * @returns {Promise<number>} Number of updated documents
 */
async function addImageToPerson(id, imagePath) {
  return new Promise((resolve, reject) => {
    if (!initialized || !db) {
      reject(new Error('Database not initialized'));
      return;
    }
    
    db.update(
      { _id: id }, 
      { $push: { images: imagePath } }, 
      {}, 
      (err, numReplaced) => {
        if (err) {
          reject(err);
        } else {
          logDebug(`Added image to person ${id}`);
          resolve(numReplaced);
        }
      }
    );
  });
}

/**
 * Check if database is initialized
 * @returns {boolean} Whether database is initialized
 */
function isInitialized() {
  return initialized;
}

// Export the module functions
module.exports = {
  init,
  addPerson,
  getAllPeople,
  getPersonById,
  updatePerson,
  deletePerson,
  updateLastRecognized,
  addImageToPerson,
  isInitialized
};