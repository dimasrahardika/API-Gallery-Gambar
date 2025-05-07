// This file serves as the entry point for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');

// ENV configuration
require('dotenv').config();

// Import JWT secret
const { JWT_SECRET } = require('../src/middlewares/auth');

// Create a new Express app for serverless environment
const app = express();

// Check if mysql2 is available
let dbStatus = { available: true, message: 'OK' };
try {
  require('mysql2');
} catch (error) {
  console.error('Error loading mysql2:', error.message);
  dbStatus = { 
    available: false, 
    message: 'MySQL2 driver not available. Database functionality will be limited.'
  };
}

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
    vercel: process.env.VERCEL === '1' ? 'true' : 'false',
    database: dbStatus
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
    jwtSecret: process.env.JWT_SECRET ? '✓ set' : '✗ not set',
    mysql2: dbStatus.available ? '✓ available' : '✗ not available'
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
        jwt_configured: JWT_SECRET ? '✓ configured' : '✗ using default',
        database: dbStatus
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

// Database connection status endpoint
app.get('/api/db-status', async (req, res) => {
  try {
    if (!dbStatus.available) {
      return res.status(503).json({
        status: 'error',
        message: 'Database driver not available',
        details: dbStatus.message,
        solution: 'Ensure mysql2 is properly installed'
      });
    }

    // Try to connect to database
    const db = require('../src/config/database');
    try {
      await db.authenticate();
      
      return res.status(200).json({
        status: 'success',
        message: 'Database connection successful',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      return res.status(503).json({
        status: 'error', 
        message: 'Database connection failed',
        error: dbError.message,
        solution: 'Check your database credentials and ensure the database server is accessible'
      });
    }
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: 'Error checking database status',
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

// Load routes conditionally based on mysql2 availability
if (dbStatus.available) {
  try {
    // Try to load the routes normally
    const imageRoutes = require('../src/routes/api/v1/imageRoutes');
    const authRoutes = require('../src/routes/api/v1/authRoutes');
    const errorHandler = require('../src/middlewares/errorHandler');

    // API routes - specific routes first
    app.use('/api/v1/images', imageRoutes);
    app.use('/api/v1/auth', authRoutes);

    // General error handling
    app.use(errorHandler);
  } catch (error) {
    console.error('Error loading routes:', error);
    // Set up fallback routes
    app.use('/api/v1/images', (req, res) => {
      res.status(503).json({
        status: 'error',
        message: 'Image API temporarily unavailable due to database issues',
        error: error.message
      });
    });

    app.use('/api/v1/auth', (req, res) => {
      if (req.path === '/login' && req.method === 'POST') {
        // Redirect to fallback login
        return app._router.handle(req, res);
      }
      
      res.status(503).json({
        status: 'error',
        message: 'Auth API temporarily unavailable due to database issues',
        error: error.message
      });
    });
  }
} else {
  // Set up fallback routes when database is not available
  app.use('/api/v1/images', (req, res) => {
    res.status(503).json({
      status: 'error',
      message: 'Image API unavailable - MySQL2 driver not installed',
      solution: 'Please contact the administrator to fix the database configuration'
    });
  });

  // Auth routes still work through fallback
  app.use('/api/v1/auth/login', (req, res, next) => {
    // Redirect to fallback login handler
    req.url = '/api/v1/auth/fallback-login';
    app._router.handle(req, res, next);
  });

  app.use('/api/v1/auth', (req, res) => {
    if (req.path !== '/login') {
      res.status(503).json({
        status: 'error',
        message: 'Auth API unavailable - MySQL2 driver not installed',
        solution: 'Please contact the administrator to fix the database configuration'
      });
    }
  });
}

// Add a healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: dbStatus
  });
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