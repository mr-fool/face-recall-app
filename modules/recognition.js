const faceapi = require('face-api.js');
const canvas = require('canvas');
const fs = require('fs');
const path = require('path');
const { app } = require('electron');

// Initialize face-api with canvas
const { Canvas, Image, ImageData } = canvas;
faceapi.env.monkeyPatch({ Canvas, Image, ImageData });

// Path to face recognition models
const MODELS_PATH = path.join(__dirname, '../assets/models');

// Initialize models
let modelsLoaded = false;

async function loadModels() {
  if (modelsLoaded) return;
  
  await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
  await faceapi.nets.faceExpressionNet.loadFromDisk(MODELS_PATH);
  
  modelsLoaded = true;
}

async function detectFace(imageBuffer) {
  await loadModels();
  
  // Load image
  const img = await canvas.loadImage(imageBuffer);
  
  // Detect faces with landmarks and descriptors
  const detections = await faceapi.detectAllFaces(img)
    .withFaceLandmarks()
    .withFaceDescriptors()
    .withFaceExpressions();
  
  return detections;
}

async function getFaceDescriptorFromImage(imagePath) {
  const buffer = fs.readFileSync(imagePath);
  const detections = await detectFace(buffer);
  
  if (detections.length === 0) {
    throw new Error('No face detected in the image');
  }
  
  if (detections.length > 1) {
    throw new Error('Multiple faces detected in the image. Please use an image with only one face.');
  }
  
  return detections[0].descriptor;
}

async function recognizeFace(imageBuffer, knownFaces) {
  await loadModels();
  
  const detections = await detectFace(imageBuffer);
  
  if (detections.length === 0) {
    return { recognized: false, message: 'No face detected' };
  }
  
  // Create face matcher with known faces
  const labeledDescriptors = knownFaces.map(person => {
    return new faceapi.LabeledFaceDescriptors(
      person._id,
      [new Float32Array(person.faceDescriptor)]
    );
  });
  
  const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
  
  // Get best match for each detected face
  const results = detections.map(detection => {
    const match = faceMatcher.findBestMatch(detection.descriptor);
    return {
      detection,
      match
    };
  });
  
  return {
    recognized: true,
    results
  };
}

module.exports = {
  loadModels,
  detectFace,
  getFaceDescriptorFromImage,
  recognizeFace
};