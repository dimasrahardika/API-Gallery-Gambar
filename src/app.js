const express = require('express');
const cors = require('cors');
const path = require('path');
const imageRoutes = require('./routes/api/v1/imageRoutes');
const authRoutes = require('./routes/api/v1/authRoutes');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Set absolute paths for clarity
const uploadsDir = path.resolve(__dirname, '../uploads');
const imagesDir = path.resolve(uploadsDir, 'images');
const thumbnailsDir = path.resolve(uploadsDir, 'thumbnails');

console.log('==== IMAGE DIRECTORIES CONFIGURATION ====');
console.log(`Images directory: ${imagesDir}`);
console.log(`Thumbnails directory: ${thumbnailsDir}`);
console.log('=======================================');

// Directly serve the image files from their folders
app.use('/images', express.static(imagesDir));
app.use('/thumbnails', express.static(thumbnailsDir));

// Serve HTML files from root - limited to only needed files
app.use(express.static(path.join(__dirname, '../'), {
  index: false,  // Disable automatic directory index
  extensions: ['html']  // Only serve HTML files
}));

// API routes
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/auth', authRoutes);

// Error handling middleware should be before the 404 handlers
app.use(errorHandler);

// Instead of using problematic wildcard routes, let's add a general 404 handler at the end
app.use((req, res) => {
  console.error(`Resource not found: ${req.path}`);
  
  // Check if the request was for an image
  if (req.path.startsWith('/images/') || req.path.startsWith('/thumbnails/')) {
    res.status(404).send('Image not found');
  } else {
    res.status(404).send('Resource not found');
  }
});

module.exports = app;