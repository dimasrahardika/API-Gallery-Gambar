const Image = require('../models/image');
const imageProcessor = require('../utils/imageProcessor');
const { join } = require('path');
const fs = require('fs').promises;

module.exports = {
  getAllImages: async (req, res) => {
    try {
      const images = await Image.findAll();
      

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const imagesWithFullUrls = images.map(image => {
        const imageData = image.toJSON();
        return {
          ...imageData,
          fullUrl: `${baseUrl}${imageData.url}`,
          fullThumbnailUrl: `${baseUrl}${imageData.thumbnailUrl}`
        };
      });
      
      res.json(imagesWithFullUrls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  getImageById: async (req, res) => {
    try {
      const image = await Image.findByPk(req.params.id);
      if (!image) return res.status(404).json({ error: 'Image not found' });
      

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      const imageWithUrls = {
        ...image.toJSON(),
        fullUrl: `${baseUrl}${image.url}`,
        fullThumbnailUrl: `${baseUrl}${image.thumbnailUrl}`
      };
      
      res.json(imageWithUrls);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  uploadImage: async (req, res) => {
    try {
      const { title, description, tags } = req.body;
      const file = req.file;
      
      const processed = await imageProcessor.processImage(file.path, file.filename);
      
      // Perbaikan untuk penanganan tags
      let parsedTags = [];
      if (tags) {
        try {
          // Coba parse tags jika dikirim sebagai JSON string
          parsedTags = JSON.parse(tags);
        } catch (e) {
          // Fallback ke metode lama jika bukan JSON valid
          parsedTags = tags.split(',');
        }
      }
      
      const imageData = {
        title,
        description,
        filename: file.filename,
        url: `/images/${file.filename}`,
        thumbnailUrl: processed.thumbnailUrl,
        tags: parsedTags,
        size: processed.size,
        width: processed.width,
        height: processed.height
      };

      const image = await Image.create(imageData);
      

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      
      res.status(201).json({
        id: image.id,
        url: image.url,
        fullUrl: `${baseUrl}${image.url}`,
        thumbnailUrl: image.thumbnailUrl,
        fullThumbnailUrl: `${baseUrl}${image.thumbnailUrl}`
      });
    } catch (error) {
      if(req.file && req.file.path) {
        await fs.unlink(req.file.path).catch(err => console.error('Error deleting file:', err));
      }
      res.status(500).json({ error: error.message });
    }
  },

  deleteImage: async (req, res) => {
    try {
      const image = await Image.findByPk(req.params.id);
      if (!image) return res.status(404).json({ error: 'Image not found' });
      
      await fs.unlink(join('uploads/images', image.filename));
      await fs.unlink(join('uploads/thumbnails', image.thumbnailUrl.split('/').pop()));
      
      await image.destroy();
      
      res.json({ message: 'Image deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
};