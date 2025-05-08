const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');

// Check if we're in a serverless environment (like Vercel)
const isServerlessEnvironment = process.env.VERCEL === '1' || process.env.AWS_LAMBDA_FUNCTION_VERSION;

// Configure storage based on environment
let storage;

if (isServerlessEnvironment) {
  // Use memory storage for serverless environments like Vercel
  storage = multer.memoryStorage();
} else {
  // Use disk storage for local development
  const uploadDir = path.join(process.cwd(), 'uploads', 'temp');
  
  // Create directory if it doesn't exist
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
      const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
      cb(null, uniqueFilename);
    }
  });
}

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// Middleware to process memory storage files for Cloudinary
const processMemoryFile = (req, res, next) => {
  if (isServerlessEnvironment && req.file && !req.file.path) {
    // Create a data URI for Cloudinary to use
    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    req.file.path = dataUri;
    
    // Create a fake filename for database
    req.file.filename = `${uuidv4()}.${req.file.mimetype.split('/')[1]}`;
  }
  next();
};

// Export both the upload middleware and the file processor
module.exports = {
  single: (field) => [upload.single(field), processMemoryFile],
  array: (field, count) => [upload.array(field, count), processMemoryFile]
};