// This file serves as the entry point for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

// Import routes
const imageRoutes = require('../src/routes/api/v1/imageRoutes');
const authRoutes = require('../src/routes/api/v1/authRoutes');
const errorHandler = require('../src/middlewares/errorHandler');
const { JWT_SECRET } = require('../src/middlewares/auth');

// Create a new Express app for serverless environment
// This ensures we have a fresh instance for each function invocation
const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Debug endpoints that don't require database
app.get('/api/debug', (req, res) => {
  res.status(200).json({ 
    status: 'success',
    message: 'Debug endpoint is working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    vercel: process.env.VERCEL === '1' ? 'true' : 'false'
  });
});

app.get('/api/env', (req, res) => {
  // Return a sanitized version of environment variables for debugging
  res.status(200).json({
    nodeEnv: process.env.NODE_ENV || 'not set',
    dbHost: process.env.DB_HOST ? '✓ set' : '✗ not set',
    dbName: process.env.DB_NAME ? '✓ set' : '✗ not set',
    dbUser: process.env.DB_USER ? '✓ set' : '✗ not set',
    dbPass: process.env.DB_PASSWORD ? '✓ set' : '✗ not set',
    jwtSecret: process.env.JWT_SECRET ? '✓ set' : '✗ not set'
  });
});

// Add auth-specific debug endpoint
app.post('/api/auth-debug', (req, res) => {
  try {
    const { email, password } = req.body;
    
    res.status(200).json({
      status: 'debug',
      message: 'Auth debug endpoint',
      receivedData: {
        email: email ? `✓ received (${email})` : '✗ missing',
        password: password ? '✓ received (hidden)' : '✗ missing'
      },
      requestInfo: {
        contentType: req.headers['content-type'],
        method: req.method,
        path: req.path,
        jwt_configured: JWT_SECRET ? '✓ configured' : '✗ using default'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Debug endpoint error',
      error: error.message
    });
  }
});

// Fallback login endpoint bila authRoutes gagal (masalah database)
app.post('/api/v1/auth/fallback-login', (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Log untuk debugging
    console.log('Fallback login attempt for:', email);
    
    // Validasi input
    if (!email || !password) {
      return res.status(400).json({
        status: 'error',
        message: 'Email dan password diperlukan'
      });
    }
    
    // Demo credentials untuk testing - seharusnya diganti dengan kredensial Anda
    const validCredentials = [
      { email: 'demo@example.com', password: 'password123', username: 'demo', role: 'user' },
      { email: 'admin@example.com', password: 'admin123', username: 'admin', role: 'admin' }
    ];
    
    // Cek kredensial
    const user = validCredentials.find(u => u.email === email && u.password === password);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Email atau password salah'
      });
    }
    
    // Generate token
    const token = jwt.sign(
      { 
        id: Math.floor(Math.random() * 1000),
        username: user.username,
        role: user.role
      }, 
      JWT_SECRET, 
      { expiresIn: '24h' }
    );
    
    console.log('Fallback login successful for:', email);
    
    // Return response
    return res.status(200).json({
      status: 'success',
      message: 'Login berhasil menggunakan fallback',
      token,
      data: {
        user: {
          id: Math.floor(Math.random() * 1000),
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    console.error('Fallback login error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan pada fallback login',
      error: error.message
    });
  }
});

// API routes - specific routes first
app.use('/api/v1/images', imageRoutes);
app.use('/api/v1/auth', authRoutes);

// General error handling
app.use(errorHandler);

// Add a healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Fallback 404 handler
app.use((req, res) => {
  res.status(404).json({
    status: 'error',
    message: `Resource not found: ${req.path}`
  });
});

// Export for Vercel
module.exports = app;