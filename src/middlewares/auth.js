const jwt = require('jsonwebtoken');
const User = require('../models/user');

// Menggunakan secret key yang lebih kuat sebagai default
const JWT_SECRET = process.env.JWT_SECRET || 'api-gallery-gambar-rahasiaJWT-verySecretKey2024!';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

const generateToken = (user) => {
  try {
    console.log('Generating token for user:', user.id);
    const token = jwt.sign(
      { 
        id: user.id, 
        username: user.username,
        role: user.role 
      }, 
      JWT_SECRET, 
      { expiresIn: JWT_EXPIRES_IN }
    );
    
    // Verifikasi token valid sebelum mengembalikannya
    jwt.verify(token, JWT_SECRET);
    console.log('Token generated successfully');
    return token;
  } catch (error) {
    console.error('Error generating token:', error);
    throw new Error('Gagal membuat token autentikasi: ' + error.message);
  }
};

const protect = async (req, res, next) => {
  try {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    
    else if (req.cookies && req.cookies.jwt) {
      token = req.cookies.jwt;
    }
    
    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Anda tidak terautentikasi. Silakan login.'
      });
    }
    
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('Token verified successfully for user ID:', decoded.id);
      
      const currentUser = await User.findByPk(decoded.id);
      if (!currentUser) {
        return res.status(401).json({
          status: 'error',
          message: 'User dengan token ini tidak lagi ada.'
        });
      }
      
      req.user = currentUser;
      next();
    } catch (jwtError) {
      console.error('JWT verification error:', jwtError);
      return res.status(401).json({
        status: 'error',
        message: 'Token tidak valid atau telah kedaluwarsa.',
        details: process.env.NODE_ENV === 'production' ? null : jwtError.message
      });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan saat memeriksa otentikasi',
      details: process.env.NODE_ENV === 'production' ? null : error.message
    });
  }
};

const restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Anda tidak memiliki izin untuk operasi ini'
      });
    }
    next();
  };
};

module.exports = {
  generateToken,
  protect,
  restrictTo,
  JWT_SECRET,
  JWT_EXPIRES_IN
};