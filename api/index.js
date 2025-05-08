// This file serves as the entry point for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const path = require('path');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;

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

// Serve static files for HTML pages and uploads
app.use(express.static(path.join(__dirname, '..')));

// Mock images data for when database is unavailable
const MOCK_IMAGES = [
  {
    id: 1,
    title: "Sample Image 1",
    description: "This is a sample image used when database is unavailable",
    filename: "sample1.jpg",
    url: "https://picsum.photos/id/237/800/600",
    thumbnailUrl: "https://picsum.photos/id/237/200/200",
    size: 12345,
    width: 800,
    height: 600,
    tags: ["sample", "database-unavailable"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 2,
    title: "Sample Image 2",
    description: "Another sample image used when database is unavailable",
    filename: "sample2.jpg",
    url: "https://picsum.photos/id/244/800/600",
    thumbnailUrl: "https://picsum.photos/id/244/200/200",
    size: 23456,
    width: 800,
    height: 600,
    tags: ["sample", "database-unavailable"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 3,
    title: "Sample Image 3",
    description: "Yet another sample image used when database is unavailable",
    filename: "sample3.jpg",
    url: "https://picsum.photos/id/250/800/600",
    thumbnailUrl: "https://picsum.photos/id/250/200/200",
    size: 34567,
    width: 800,
    height: 600,
    tags: ["sample", "database-unavailable"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

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

// Add a healthcheck endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
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

// Special route to handle images API - uses mock data when database is unavailable
app.get('/api/v1/images', async (req, res) => {
  try {
    // First try to use the regular router if database is available
    if (dbStatus.available) {
      try {
        const Image = require('../src/models/image');
        const images = await Image.findAll();
        return res.json(images);
      } catch (dbError) {
        console.error('Failed to fetch images from database:', dbError);
        // Fall back to mock data
      }
    }
    
    // Return mock images data when database is unavailable
    console.log('Returning mock images data');
    return res.json(MOCK_IMAGES);
  } catch (error) {
    console.error('Error in /api/v1/images fallback:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching images',
      details: error.message
    });
  }
});

// Fallback login endpoint bila authRoutes gagal (masalah database)
app.post('/api/v1/auth/login', (req, res) => {
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

// Try to load normal routes if possible
try {
  if (dbStatus.available) {
    const imageRoutes = require('../src/routes/api/v1/imageRoutes');
    const authRoutes = require('../src/routes/api/v1/authRoutes');
    
    // Only use these routes if we haven't already defined special handlers
    app.use('/api/v1/auth', authRoutes);
  }
} catch (error) {
  console.error('Error loading normal routes:', error.message);
}

// Fallback 404 handler that checks for HTML files
app.use(async (req, res, next) => {
  try {
    // For HTML requests, try to send the HTML file directly
    if (req.path.endsWith('.html')) {
      const htmlPath = path.join(__dirname, '..', req.path);
      try {
        await fs.access(htmlPath);
        return res.sendFile(htmlPath);
      } catch (err) {
        // File doesn't exist, continue to 404
      }
    }
    
    res.status(404).json({
      status: 'error',
      message: `Resource not found: ${req.path}`
    });
  } catch (error) {
    console.error('Error in 404 handler:', error);
    next();
  }
});

// Export for Vercel
module.exports = app;