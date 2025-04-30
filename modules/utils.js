/**
 * utils.js - Utility functions module
 * 
 * This module provides helper functions used throughout the application
 */

// Module dependencies
const fs = require('fs');

// Debug helper
function logDebug(message) {
  console.log(`[UTILS] ${message}`);
}

/**
 * Create a random ID
 * @returns {string} Random ID string
 */
function generateId() {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

/**
 * Format a date for display
 * @param {Date|string|number} date - Date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date string
 */
function formatDate(date, includeTime = true) {
  if (!date) return 'Never';
  
  const dateObj = new Date(date);
  if (isNaN(dateObj.getTime())) return 'Invalid date';
  
  if (includeTime) {
    return dateObj.toLocaleString();
  } else {
    return dateObj.toLocaleDateString();
  }
}

/**
 * Safely read a file as data URL
 * @param {string} filePath - Path to file
 * @returns {Promise<string>} Data URL
 */
function fileToDataUrl(filePath) {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(filePath, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const base64data = data.toString('base64');
          const extension = filePath.split('.').pop().toLowerCase();
          const mimeType = getMimeType(extension);
          resolve(`data:${mimeType};base64,${base64data}`);
        }
      });
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get MIME type from file extension
 * @param {string} extension - File extension
 * @returns {string} MIME type
 */
function getMimeType(extension) {
  const mimeTypes = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'bmp': 'image/bmp',
    'webp': 'image/webp'
  };
  
  return mimeTypes[extension] || 'application/octet-stream';
}

/**
 * Debounce a function to limit how often it can be called
 * @param {Function} func - Function to debounce
 * @param {number} wait - Milliseconds to wait
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Display an error in a user-friendly way
 * @param {Error|string} error - Error to display
 * @param {string} context - Context where error occurred
 */
function handleError(error, context = '') {
  const errorMessage = error instanceof Error ? error.message : error;
  console.error(`Error ${context ? 'in ' + context : ''}:`, error);
  alert(`An error occurred ${context ? 'while ' + context : ''}: ${errorMessage}`);
}

/**
 * Check if a file exists
 * @param {string} filePath - Path to file
 * @returns {Promise<boolean>} Whether file exists
 */
async function fileExists(filePath) {
  return new Promise((resolve) => {
    fs.access(filePath, fs.constants.F_OK, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Create a directory if it doesn't exist
 * @param {string} dirPath - Path to directory
 * @returns {Promise<boolean>} Whether operation was successful
 */
async function ensureDirectoryExists(dirPath) {
  return new Promise((resolve) => {
    fs.mkdir(dirPath, { recursive: true }, (err) => {
      resolve(!err);
    });
  });
}

/**
 * Safely parse JSON with fallback
 * @param {string} jsonString - JSON string to parse
 * @param {*} fallback - Fallback value if parsing fails
 * @returns {*} Parsed object or fallback
 */
function safeJsonParse(jsonString, fallback = {}) {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error('Error parsing JSON:', error);
    return fallback;
  }
}

/**
 * Convert ArrayBuffer to Base64 string
 * @param {ArrayBuffer} buffer - ArrayBuffer to convert
 * @returns {string} Base64 string
 */
function arrayBufferToBase64(buffer) {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return window.btoa(binary);
}

/**
 * Convert Base64 string to ArrayBuffer
 * @param {string} base64 - Base64 string to convert
 * @returns {ArrayBuffer} ArrayBuffer
 */
function base64ToArrayBuffer(base64) {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  return bytes.buffer;
}

// Export the module functions
module.exports = {
  generateId,
  formatDate,
  fileToDataUrl,
  debounce,
  handleError,
  fileExists,
  ensureDirectoryExists,
  safeJsonParse,
  arrayBufferToBase64,
  base64ToArrayBuffer
};