
const jwt = require('jsonwebtoken');
const User = require('../models/user');


const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-should-be-in-env';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';


const generateToken = (user) => {
  return jwt.sign(
    { 
      id: user.id, 
      username: user.username,
      role: user.role 
    }, 
    JWT_SECRET, 
    { expiresIn: JWT_EXPIRES_IN }
  );
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
    
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    
    const currentUser = await User.findByPk(decoded.id);
    if (!currentUser) {
      return res.status(401).json({
        status: 'error',
        message: 'User dengan token ini tidak lagi ada.'
      });
    }
    
    
    req.user = currentUser;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: 'Token tidak valid atau telah kedaluwarsa.'
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