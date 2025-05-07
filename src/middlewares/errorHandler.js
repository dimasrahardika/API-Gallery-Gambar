const multer = require('multer');

module.exports = (err, req, res, next) => {
    console.error(err.stack);
    
    if (err instanceof multer.MulterError) {
      return res.status(400).json({
        error: 'File upload error',
        message: err.message
      });
    }
    
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message
    });
  };