// This file serves as the entry point for Vercel serverless functions
// It exports the Express app directly

// Import the Express app
const app = require('../src/app');

// Export for Vercel
module.exports = app;