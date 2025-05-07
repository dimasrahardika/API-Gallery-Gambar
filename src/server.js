require('dotenv').config();
console.log('Starting server...');
console.log('Loading modules...');

const app = require('./app');
console.log('App module loaded');

const sequelize = require('./config/database');
console.log('Database config loaded');

const PORT = process.env.PORT || 3000;
console.log(`Using port: ${PORT}`);

// Improved database connection handling
async function testDatabaseConnection() {
  console.log('Attempting database connection...');
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    return true;
  } catch (error) {
    console.error('Database connection error:', error.message);
    // Don't crash in production/serverless - just log the error
    if (process.env.NODE_ENV === 'development') {
      throw error;
    }
    return false;
  }
}

// Start server function
async function startServer() {
  // Try to connect to database but continue even if it fails in production
  await testDatabaseConnection().catch(err => {
    if (process.env.NODE_ENV === 'development') {
      console.error('Database connection failed:', err);
    }
  });
  
  // Only actually listen for connections if not in a serverless environment
  // In Vercel, we just need to export the Express app
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`Server berjalan pada port ${PORT}`);
      console.log(`API endpoints tersedia di: http://localhost:${PORT}/api/v1/images`);
    });
  }
}

// In Vercel, we just run the startup sequence but don't need to actually
// call listen() as Vercel handles that part
startServer();

// Export the Express app for serverless environments
module.exports = app;