const Image = require('../models/image');
const fs = require('fs').promises;
const cloudinary = require('../config/cloudinary');
const path = require('path');

module.exports = {
  getAllImages: async (req, res) => {
    try {
      let images;
      
      try {
        // Wrap the database query in a try-catch to handle database errors gracefully
        images = await Image.findAll();
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
      
      res.json(image);
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
      
      // Upload file to Cloudinary
      let cloudinaryUpload;
      try {
        // Handle both path-based files and memory-stored files
        // If file.path exists and doesn't start with data:, use it directly
        // Otherwise, if buffer exists, create a data URI
        let uploadSource;
        if (file.path && !file.path.startsWith('data:')) {
          uploadSource = file.path;
        } else if (file.buffer) {
          // Create a data URI from the buffer
          const fileFormat = file.mimetype.split('/')[1];
          uploadSource = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
        }
        
        cloudinaryUpload = await cloudinary.uploader.upload(uploadSource, {
          folder: "gallery_images",
          resource_type: "auto"
        });
        
        console.log('Cloudinary upload successful:', cloudinaryUpload.secure_url);
        
        // Generate thumbnail using Cloudinary transformation
        const thumbnailUrl = cloudinary.url(cloudinaryUpload.public_id, {
          width: 200,
          height: 200,
          crop: 'fill',
          format: 'jpg',
          quality: 80
        });
        
        // Save to database
        const imageData = {
          title,
          description,
          filename: file.originalname || path.basename(file.path || 'unknown'),
          url: cloudinaryUpload.secure_url,
          thumbnailUrl: thumbnailUrl,
          cloudinary_id: cloudinaryUpload.asset_id,
          publicId: cloudinaryUpload.public_id,
          tags: parsedTags,
          size: cloudinaryUpload.bytes,
          width: cloudinaryUpload.width,
          height: cloudinaryUpload.height
        };

        const image = await Image.create(imageData);
        
        // Delete temporary file after uploading to cloudinary (if it exists)
        if (file && file.path && !file.path.startsWith('data:')) {
          try {
            await fs.unlink(file.path);
            console.log(`Temporary file ${file.path} deleted successfully`);
          } catch (unlinkErr) {
            console.error('Error deleting temporary file:', unlinkErr);
            // Don't block the process if temporary file deletion fails
          }
        }
        
        res.status(201).json({
          id: image.id,
          url: image.url,
          thumbnailUrl: image.thumbnailUrl
        });
      } catch (cloudError) {
        console.error("Cloudinary upload error:", cloudError);
        return res.status(500).json({ 
          status: 'error',
          type: 'UPLOAD_ERROR',
          message: 'Failed to upload image to cloud storage',
          details: process.env.NODE_ENV === 'production' ? null : cloudError.message
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      // Clean up temporary file in case of error
      if (req.file && req.file.path && !req.file.path.startsWith('data:')) {
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
      
      // Eliminar imagen de Cloudinary si existe publicId
      if (image.publicId) {
        try {
          const result = await cloudinary.uploader.destroy(image.publicId);
          console.log('Cloudinary delete result:', result);
        } catch (cloudError) {
          console.error("Cloudinary delete error:", cloudError);
          // Continuar con el proceso aunque falle la eliminación en Cloudinary
        }
      }
      
      // Eliminar de la base de datos
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