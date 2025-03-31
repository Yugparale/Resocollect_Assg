const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Readable } = require('stream');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Atlas Connection String
// Replace with your actual connection string from MongoDB Atlas
const MONGODB_URI = "mongodb+srv://yugparle:xhmJByEn8lcLWMOl@cluster0.bngrf.mongodb.net/Loans?retryWrites=true&w=majority&appName=Cluster0";

// MongoDB Connection with improved options
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 30000, // Increase timeout to 30 seconds
  socketTimeoutMS: 45000, // Increase socket timeout
})
.then(() => {
  console.log('MongoDB Atlas connected');
})
.catch(err => {
  console.error('MongoDB connection error:', err);
  console.log('Please check your MongoDB Atlas connection string and network connectivity');
});

// Configure multer for file uploads - use memory storage to avoid disk I/O
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // Limit file size to 10MB
  }
});

// Keep track of all collections
let activeCollection = 'loans'; // Default collection
let allCollections = [];

// Initialize collections list
async function initializeCollections() {
  try {
    const collections = await mongoose.connection.db.listCollections().toArray();
    allCollections = collections
      .map(col => col.name)
      .filter(name => !name.startsWith('system.') && name !== 'csv_metadata');
    
    // Set the most recent collection as active if available
    if (allCollections.length > 0) {
      activeCollection = allCollections[allCollections.length - 1];
    }
    
    console.log('Available collections:', allCollections);
    console.log('Active collection:', activeCollection);
  } catch (err) {
    console.error('Error initializing collections:', err);
  }
}

// Call after connection is established
mongoose.connection.once('open', initializeCollections);

// Routes
app.get('/api/loans', async (req, res) => {
  try {
    // Use the active collection
    const collection = mongoose.connection.db.collection(activeCollection);
    
    // Use lean() for better performance - returns plain JS objects instead of Mongoose documents
    const loans = await collection.find().toArray();
    
    // Get the current columns from metadata
    const metadata = await mongoose.connection.db.collection('csv_metadata').findOne({ 
      collection: activeCollection 
    });
    
    const columns = metadata?.columns || [];
    
    res.json({
      loans: loans,
      columns: columns,
      collection: activeCollection
    });
  } catch (err) {
    console.error('Error fetching loans:', err);
    res.status(500).json({ message: err.message });
  }
});

// Get all available collections
app.get('/api/collections', async (req, res) => {
  try {
    await initializeCollections(); // Refresh the list
    res.json({
      collections: allCollections,
      active: activeCollection
    });
  } catch (err) {
    console.error('Error fetching collections:', err);
    res.status(500).json({ message: err.message });
  }
});

// Set active collection
app.post('/api/collections/set-active', async (req, res) => {
  try {
    const { collection } = req.body;
    
    if (!collection) {
      return res.status(400).json({ message: 'Collection name is required' });
    }
    
    // Verify collection exists
    const collections = await mongoose.connection.db.listCollections({ name: collection }).toArray();
    if (collections.length === 0) {
      return res.status(404).json({ message: 'Collection not found' });
    }
    
    activeCollection = collection;
    res.json({ message: 'Active collection updated', active: activeCollection });
  } catch (err) {
    console.error('Error setting active collection:', err);
    res.status(500).json({ message: err.message });
  }
});

// Optimized CSV upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  const results = [];
  let headers = [];
  
  try {
    // Create a readable stream from the buffer
    const fileStream = new Readable();
    fileStream.push(req.file.buffer);
    fileStream.push(null);
    
    // Generate a unique collection name based on timestamp and file name
    const timestamp = Date.now();
    const fileName = req.file.originalname.replace(/\.[^/.]+$/, ""); // Remove extension
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 20);
    const newCollectionName = `loans_${sanitizedFileName}_${timestamp}`;
    
    console.log(`Creating new collection: ${newCollectionName}`);
    
    // Process the CSV file
    fileStream
      .pipe(csv())
      .on('headers', (headerList) => {
        headers = headerList;
        console.log('CSV Headers:', headers);
      })
      .on('data', (data) => results.push(data))
      .on('end', async () => {
        try {
          console.log(`Processing ${results.length} records from CSV`);
          
          // Start a session for transaction
          const session = await mongoose.startSession();
          session.startTransaction();
          
          try {
            // Create a new collection for this upload
            const newCollection = mongoose.connection.db.collection(newCollectionName);
            
            // Store the headers/columns for future reference
            await mongoose.connection.db.collection('csv_metadata').updateOne(
              { collection: newCollectionName },
              { $set: { columns: headers, uploadDate: new Date() } },
              { upsert: true }
            );
            
            // Prepare bulk operations for better performance
            const bulkOps = [];
            
            for (const row of results) {
              // Generate a unique loanNumber if not provided
              const loanNumber = row.loanNumber || row['Loan Number'] || row[headers[0]] || 
                `LOAN-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
              
              // Create a document with all fields from the CSV row
              const loanData = { loanNumber };
              
              for (const key in row) {
                // Try to convert numeric values
                const value = !isNaN(row[key]) && row[key] !== '' ? parseFloat(row[key]) : row[key];
                loanData[key] = value;
              }
              
              // Add to bulk operations
              bulkOps.push({
                insertOne: {
                  document: loanData
                }
              });
            }
            
            // Execute bulk operations if there are any
            if (bulkOps.length > 0) {
              await newCollection.bulkWrite(bulkOps, { session });
            }
            
            // Set this as the active collection
            activeCollection = newCollectionName;
            
            // Update the collections list
            await initializeCollections();
            
            // Commit the transaction
            await session.commitTransaction();
            session.endSession();
            
            res.status(200).json({ 
              message: 'File uploaded and processed successfully',
              count: bulkOps.length,
              columns: headers,
              collection: newCollectionName
            });
          } catch (err) {
            // Abort transaction on error
            await session.abortTransaction();
            session.endSession();
            throw err;
          }
        } catch (err) {
          console.error('Error processing CSV:', err);
          res.status(500).json({ message: err.message });
        }
      });
  } catch (err) {
    console.error('Error reading file:', err);
    res.status(500).json({ message: err.message });
  }
});

// Add a new endpoint to get the current CSV columns
app.get('/api/columns', async (req, res) => {
  try {
    // Get the stored headers from metadata collection for the active collection
    const metadata = await mongoose.connection.db.collection('csv_metadata').findOne({ 
      collection: activeCollection 
    });
    
    if (metadata && metadata.columns) {
      res.json(metadata.columns);
    } else {
      // If no headers are stored yet, get all fields from the first document
      const sampleLoan = await mongoose.connection.db.collection(activeCollection).findOne();
      if (sampleLoan) {
        // Get all fields from the document (excluding MongoDB internal fields)
        const columns = Object.keys(sampleLoan).filter(key => !key.startsWith('_'));
        res.json(columns);
      } else {
        // Empty array if no data exists
        res.json([]);
      }
    }
  } catch (err) {
    console.error('Error fetching columns:', err);
    res.status(500).json({ message: err.message });
  }
});

// Fallback route for checking server status
app.get('/', (req, res) => {
  res.send('Loan Dashboard API is running');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} to check server status`);
}); 