const sharp = require('sharp');
const { join } = require('path');
const fs = require('fs').promises;

const processImage = async (inputPath, filename) => {
  const image = sharp(inputPath);
  const metadata = await image.metadata();
  
  // Create thumbnail
  const thumbnailFilename = `thumb_${filename}`;
  await image
    .resize(300, 300, { fit: 'inside' })
    .toFile(join('uploads/thumbnails', thumbnailFilename));

  return {
    width: metadata.width,
    height: metadata.height,
    size: metadata.size,
    thumbnailUrl: `/thumbnails/${thumbnailFilename}`
  };
};

module.exports = { processImage };