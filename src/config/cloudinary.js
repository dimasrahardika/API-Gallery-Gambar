// filepath: c:\laragon\www\API_GaleriGambar\src\config\cloudinary.js
const cloudinary = require('cloudinary').v2;

// Configuración de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',  // Usar 'demo' como respaldo para pruebas
  api_key: process.env.CLOUDINARY_API_KEY || '123456789012345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcdefghijklmnopqrstuvwxyz12'
});

module.exports = cloudinary;