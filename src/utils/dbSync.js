// filepath: c:\laragon\www\API_GaleriGambar\src\utils\dbSync.js
const sequelize = require('../config/database');
const Image = require('../models/image');
const User = require('../models/user');

async function syncDB() {
  try {
    await sequelize.authenticate();
    console.log('Koneksi database berhasil ke', process.env.DB_HOST);
    

    await sequelize.sync({ force: true });
    console.log('Database berhasil disinkronkan! Tabel telah dibuat.');
    
    // Cek model definitions
    console.log('Model Image table name:', Image.tableName);
    console.log('Model User table name:', User.tableName);
    
    await sequelize.close();
  } catch (error) {
    console.error('Sinkronisasi gagal:', error);
    console.error(error.stack);
  }
}

syncDB();