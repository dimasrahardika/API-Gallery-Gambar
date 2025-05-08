const Image = require('../models/image');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const sharp = require('sharp');

// Define image storage paths
const IMAGES_DIR = path.join(process.cwd(), 'uploads', 'images');
const THUMBNAILS_DIR = path.join(process.cwd(), 'uploads', 'thumbnails');

// Ensure directories exist
const ensureDirectoryExists = async (directory) => {
  try {
    await fs.access(directory);
  } catch (error) {
    await fs.mkdir(directory, { recursive: true });
  }
};

// Normalize image URLs for consistent format
const normalizeImageUrl = (url) => {
  if (!url) return null;
  
  // Extract filename from URL
  const filename = path.basename(url);
  
  // Create standardized URL format
  if (url.includes('thumb_')) {
    return `/thumbnails/${filename}`;
  } else {
    return `/images/${filename}`;
  }
};

module.exports = {
  getAllImages: async (req, res) => {
    try {
      let images;
      
      try {
        // Wrap the database query in a try-catch to handle database errors gracefully
        images = await Image.findAll();
        
        // Normalize URLs in the response
        images = images.map(image => {
          const img = image.toJSON();
          img.url = normalizeImageUrl(img.url);
          img.thumbnailUrl = normalizeImageUrl(img.thumbnailUrl);
          return img;
        });
      } catch (dbError) {
        console.error('Database error when fetching images:', dbError);
        return res.status(503).json({ 
          status: 'error',
          message: 'Unable to fetch images from database',
          details: process.env.NODE_ENV === 'production' ? null : dbError.message
        });
      }
      
      res.json(images);
    } catch (error) {
      console.error('Error in getAllImages:', error);
      res.status(500).json({ 
        status: 'error',
        type: 'SERVER_ERROR',
        message: 'An error occurred while fetching images',
        details: process.env.NODE_ENV === 'production' ? null : error.message
      });
    }
  },

  getImageById: async (req, res) => {
    try {
      const image = await Image.findByPk(req.params.id);
      if (!image) return res.status(404).json({ error: 'Image not found' });
      
      // Normalize URLs
      const result = image.toJSON();
      result.url = normalizeImageUrl(result.url);
      result.thumbnailUrl = normalizeImageUrl(result.thumbnailUrl);
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadImage: async (req, res) => {
    try {
      const { title, description, tags } = req.body;
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({ 
          status: 'error',
          message: 'No file uploaded'
        });
      }
      
      // Parse tags
      let parsedTags = [];
      if (tags) {
        try {
          parsedTags = typeof tags === 'string' ? JSON.parse(tags) : tags;
        } catch (e) {
          parsedTags = tags.split(',').map(tag => tag.trim());
        }
      }
      
      // Ensure directories exist
      await Promise.all([
        ensureDirectoryExists(IMAGES_DIR),
        ensureDirectoryExists(THUMBNAILS_DIR)
      ]);

      // Generate unique filename
      const fileExtension = path.extname(file.originalname);
      const uniqueFilename = `${uuidv4()}${fileExtension}`;
      const imageFilePath = path.join(IMAGES_DIR, uniqueFilename);
      const thumbnailFilename = `thumb_${uniqueFilename}`;
      const thumbnailFilePath = path.join(THUMBNAILS_DIR, thumbnailFilename);
      
      // Get source data for image processing
      let imageBuffer;
      if (file.buffer) {
        imageBuffer = file.buffer;
      } else if (file.path) {
        imageBuffer = await fs.readFile(file.path);
      }
      
      // Process and save the original image
      await fs.writeFile(imageFilePath, imageBuffer);
      
      // Generate thumbnail
      await sharp(imageBuffer)
        .resize(200, 200, { fit: 'cover' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailFilePath);
      
      // Get image dimensions
      const metadata = await sharp(imageBuffer).metadata();
      
      // Use consistent URL format (/images/filename.jpg)
      const imageUrl = `/images/${uniqueFilename}`;
      const thumbnailUrl = `/thumbnails/${thumbnailFilename}`;
      
      // Save to database
      const imageData = {
        title,
        description,
        filename: uniqueFilename,
        url: imageUrl,
        thumbnailUrl: thumbnailUrl,
        size: file.size,
        width: metadata.width,
        height: metadata.height,
        tags: parsedTags
      };

      const image = await Image.create(imageData);
      
      // Delete temporary file if it exists
      if (file && file.path) {
        try {
          await fs.unlink(file.path);
          console.log(`Temporary file ${file.path} deleted successfully`);
        } catch (unlinkErr) {
          console.error('Error deleting temporary file:', unlinkErr);
        }
      }
      
      res.status(201).json({
        id: image.id,
        url: image.url,
        thumbnailUrl: image.thumbnailUrl
      });
    } catch (error) {
      console.error("Upload error:", error);
      // Clean up temporary file in case of error
      if (req.file && req.file.path) {
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkErr) {
          console.error('Error deleting temporary file during error handling:', unlinkErr);
        }
      }
      res.status(500).json({ 
        status: 'error',
        message: 'An error occurred during image upload',
        details: process.env.NODE_ENV === 'production' ? null : error.message
      });
    }
  },

  deleteImage: async (req, res) => {
    try {
      const image = await Image.findByPk(req.params.id);
      if (!image) return res.status(404).json({ error: 'Image not found' });
      
      // Get filenames from URLs
      const filename = path.basename(image.url);
      const thumbnailFilename = path.basename(image.thumbnailUrl);
      
      // Delete files from filesystem
      try {
        await fs.unlink(path.join(IMAGES_DIR, filename));
        await fs.unlink(path.join(THUMBNAILS_DIR, thumbnailFilename));
      } catch (fsError) {
        console.error("File deletion error:", fsError);
        // Continue with database deletion even if file deletion fails
      }
      
      // Delete from database
      await image.destroy();
      
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      console.error("Delete error:", error);
      res.status(500).json({ 
        error: error.message,
        type: 'SERVER_ERROR',
        message: 'An unexpected error occurred while deleting the image'
      });
    }
  }
};