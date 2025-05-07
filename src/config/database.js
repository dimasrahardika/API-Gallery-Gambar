const { Sequelize } = require('sequelize');
require('dotenv').config();

// For Vercel serverless environment
const isProduction = process.env.NODE_ENV === 'production';

// Coba load mysql2 module
let mysql2;
try {
  mysql2 = require('mysql2');
  console.log('MySQL2 module loaded successfully');
} catch (error) {
  console.error('Failed to load mysql2:', error.message);
  mysql2 = null;
}

// Create a function to get a Sequelize instance
const getConnection = () => {
  try {
    // Cek apakah mysql2 tersedia
    if (!mysql2 && isProduction) {
      console.error('WARNING: mysql2 not available. Using fallback connection approach.');
      return createDummySequelize('MySQL2 package not installed. Please add mysql2 to your dependencies.');
    }
    
    // Gunakan DATABASE_URL jika tersedia (format: mysql://user:password@host:port/database)
    if (process.env.DATABASE_URL) {
      console.log('Using DATABASE_URL for connection');
      return new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        dialectModule: mysql2, // Explicitly set the dialect module
        logging: isProduction ? false : console.log,
        ssl: process.env.DB_SSL === 'true',
        pool: {
          max: isProduction ? 2 : 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        }
      });
    }
    
    // Gunakan konfigurasi individual
    return new Sequelize(
      process.env.DB_NAME || 'gallery_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      {
        host: process.env.DB_HOST || 'localhost',
        dialect: 'mysql',
        dialectModule: mysql2, // Explicitly set the dialect module
        port: process.env.DB_PORT || 3306,
        logging: isProduction ? false : console.log,
        pool: {
          max: isProduction ? 2 : 10,
          min: 0,
          acquire: 30000,
          idle: 10000
        },
        dialectOptions: {
          ssl: process.env.DB_SSL === 'true' ? {
            require: true,
            rejectUnauthorized: false
          } : false
        }
      }
    );
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    // Return a dummy sequelize that won't crash but will report errors
    return createDummySequelize(error.message);
  }
};

// Fungsi untuk membuat dummy Sequelize object ketika koneksi gagal
function createDummySequelize(errorMessage) {
  return {
    authenticate: async () => {
      throw new Error(`Database connection was not initialized properly: ${errorMessage}`);
    },
    define: () => ({
      sync: async () => {},
      findAll: async () => [],
      findOne: async () => null,
      findByPk: async () => null,
      create: async () => ({}),
      destroy: async () => {}
    }),
    sync: async () => {},
    model: () => ({
      findAll: async () => [],
      findOne: async () => null,
      findByPk: async () => null,
      create: async () => ({}),
      destroy: async () => {}
    }),
    models: {}
  };
}

// Create and export the connection
const sequelize = getConnection();

module.exports = sequelize;