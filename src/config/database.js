const { Sequelize } = require('sequelize');
require('dotenv').config();

// For Vercel serverless environment
const isProduction = process.env.NODE_ENV === 'production';

// Fungsi untuk memastikan mysql2 terinstall
function ensureMysql2Installed() {
  try {
    // Mencoba untuk memuat mysql2
    require('mysql2');
    return true;
  } catch (error) {
    console.error('MySQL2 package not installed. Trying to fallback to alternative approach.');
    return false;
  }
}

// Create connection options with better defaults for serverless
const config = {
  host: process.env.DB_HOST || 'localhost',
  dialect: 'mysql',
  port: process.env.DB_PORT || 3306,
  logging: isProduction ? false : console.log,
  pool: {
    max: isProduction ? 2 : 10, // Lower connection pool in serverless
    min: 0,
    acquire: 30000,
    idle: 10000
  },
  dialectOptions: {
    // Enable SSL for production database connections
    ssl: process.env.DB_SSL === 'true' ? {
      require: true,
      rejectUnauthorized: false
    } : false
  }
};

// Create a function to get a Sequelize instance - allows better handling in serverless
const getConnection = () => {
  try {
    // Periksa apakah mysql2 terinstall
    const isMysql2Available = ensureMysql2Installed();
    if (!isMysql2Available && isProduction) {
      console.error('WARNING: mysql2 not available. Using fallback connection approach.');
      // Dalam lingkungan produksi, kita harus mengembalikan dummy Sequelize
      return createDummySequelize('MySQL2 package not installed. Please add mysql2 to your dependencies.');
    }

    return new Sequelize(
      process.env.DB_NAME || 'gallery_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      config
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