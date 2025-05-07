require('dotenv').config();
console.log('Starting server...');
console.log('Loading modules...');

const app = require('./app');
console.log('App module loaded');

const sequelize = require('./config/database');
console.log('Database config loaded');

const PORT = process.env.PORT || 3000;
console.log(`Using port: ${PORT}`);

// Uji koneksi database
async function startServer() {
  console.log('Attempting database connection...');
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil.');
    
    app.listen(PORT, () => {
      console.log(`Server berjalan pada port ${PORT}`);
      console.log(`API endpoints tersedia di: http://localhost:${PORT}/api/v1/images`);
    });
  } catch (error) {
    console.error('Tidak dapat terhubung ke database:', error);
  }
}

startServer();