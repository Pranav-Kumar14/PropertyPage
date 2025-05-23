const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(express.json()); 
app.use(cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
  }));
app.use(bodyParser.json());

const PORT = 4000;

const mainConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: process.env.DATABASE_NAME});
const logConnection = mongoose.createConnection(process.env.MONGO_URI, { dbName: process.env.DATABASE_NAME});

const PropertySchema = new mongoose.Schema({}, { strict: false });
const LogSchema = new mongoose.Schema({
  username: String,
  modifications: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});


const Property = mainConnection.model('Property', PropertySchema);
const Log = logConnection.model('Log', LogSchema);

app.post('/upload', async (req, res) => {
    try {
      const newProperty = new Property(req.body);
      const saved = await newProperty.save();
      res.status(201).json({ message: 'Property uploaded successfully.', _id: saved._id });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  

app.get('/property/:id', async (req, res) => {
  try {
    const property = await Property.findById(req.params.id);
    res.json(property);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/property/:id', async (req, res) => {
  try {
    const updates = req.body.updates;
    const username = req.body.username;

    const property = await Property.findById(req.params.id);
    if (!property) return res.status(404).json({ error: "Property not found" });

    const modifications = {};

    for (const sectionKey in updates) {
      const originalSection = property[sectionKey] || {};
      const updatedSection = updates[sectionKey];

      for (const fieldKey in updatedSection) {
        const originalValue = originalSection[fieldKey];
        const newValue = updatedSection[fieldKey];

        const changed = JSON.stringify(originalValue) !== JSON.stringify(newValue);
        if (changed) {
          if (!modifications[sectionKey]) modifications[sectionKey] = {};
          modifications[sectionKey][fieldKey] = {
            OLD_VALUE: originalValue,
            NEW_VALUE: newValue
          };

          property[sectionKey][fieldKey] = newValue;
        }
      }
    }

    if (Object.keys(modifications).length > 0) {
      await property.save();

      const logEntry = new Log({
        username,
        modifications
      });
      await logEntry.save();

      res.json({ message: "Property updated and changes logged." });
    } else {
      res.json({ message: "No changes detected." });
    }
  } catch (err) {
    console.error("Update error:", err);
    res.status(500).json({ error: err.message });
  }
});


app.get('/logs', async (req, res) => {
  try {
    const logs = await Log.find().sort({ timestamp: -1 }).limit(50);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
  
