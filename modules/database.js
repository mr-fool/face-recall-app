const Datastore = require('nedb');
const path = require('path');

// We'll use a flexible approach that works in both main and renderer process
let dbPath = path.join(__dirname, 'data');

// Database initialization with a placeholder path, 
// will be updated by the init function
let db = new Datastore({
  filename: path.join(dbPath, 'people.db'),
  autoload: true
});

// Initialize the database with the correct path
function initDatabase(userDataPath) {
  dbPath = userDataPath;
  
  // Re-initialize the database with the correct path
  db = new Datastore({
    filename: path.join(dbPath, 'people.db'),
    autoload: true
  });
  
  console.log('Database initialized at:', path.join(dbPath, 'people.db'));
  return true;
}

// Person model
class Person {
  constructor(name, relationship, notes, faceDescriptor) {
    this.name = name;
    this.relationship = relationship;
    this.notes = notes;
    this.faceDescriptor = faceDescriptor;
    this.images = [];
    this.createdAt = new Date();
    this.lastRecognized = null;
  }
}

// Database operations
module.exports = {
  // Initialize database with the correct path
  init: initDatabase,
  
  // Add a new person to the database
  addPerson: (person) => {
    return new Promise((resolve, reject) => {
      db.insert(person, (err, newDoc) => {
        if (err) reject(err);
        else resolve(newDoc);
      });
    });
  },
  
  // Get all people from the database
  getAllPeople: () => {
    return new Promise((resolve, reject) => {
      db.find({}).sort({ name: 1 }).exec((err, docs) => {
        if (err) reject(err);
        else resolve(docs);
      });
    });
  },
  
  // Get a person by ID
  getPersonById: (id) => {
    return new Promise((resolve, reject) => {
      db.findOne({ _id: id }, (err, doc) => {
        if (err) reject(err);
        else resolve(doc);
      });
    });
  },
  
  // Update a person
  updatePerson: (id, updates) => {
    return new Promise((resolve, reject) => {
      db.update({ _id: id }, { $set: updates }, {}, (err, numReplaced) => {
        if (err) reject(err);
        else resolve(numReplaced);
      });
    });
  },
  
  // Delete a person
  deletePerson: (id) => {
    return new Promise((resolve, reject) => {
      db.remove({ _id: id }, {}, (err, numRemoved) => {
        if (err) reject(err);
        else resolve(numRemoved);
      });
    });
  },
  
  // Update last recognized timestamp
  updateLastRecognized: (id) => {
    return new Promise((resolve, reject) => {
      db.update(
        { _id: id }, 
        { $set: { lastRecognized: new Date() } }, 
        {}, 
        (err, numReplaced) => {
          if (err) reject(err);
          else resolve(numReplaced);
        }
      );
    });
  },
  
  // Add an image to a person
  addImageToPerson: (id, imagePath) => {
    return new Promise((resolve, reject) => {
      db.update(
        { _id: id }, 
        { $push: { images: imagePath } }, 
        {}, 
        (err, numReplaced) => {
          if (err) reject(err);
          else resolve(numReplaced);
        }
      );
    });
  }
};