const Datastore = require('nedb');
const path = require('path');

// Database initialization
const db = new Datastore({
  filename: path.join(app.getPath('userData'), 'people.db'),
  autoload: true
});

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