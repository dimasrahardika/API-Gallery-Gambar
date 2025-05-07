// This file serves as the entry point for Vercel serverless functions
const express = require('express');
const cors = require('cors');
const path = require('path');

// Import routes
const imageRoutes = require('../src/routes/api/v1/imageRoutes');
const authRoutes = require('../src/routes/api/v1/authRoutes');
const errorHandler = require('../src/middlewares/errorHandler');

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