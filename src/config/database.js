const { Sequelize } = require('sequelize');
require('dotenv').config();

// For Vercel serverless environment
const isProduction = process.env.NODE_ENV === 'production';

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
    return new Sequelize(
      process.env.DB_NAME || 'gallery_db',
      process.env.DB_USER || 'root',
      process.env.DB_PASSWORD || '',
      config
    );
  } catch (error) {
    console.error('Failed to initialize database connection:', error);
    // Return a dummy sequelize that won't crash but will report errors
    return {
      authenticate: async () => {
        throw new Error('Database connection was not initialized properly');
      },
      define: () => ({
        sync: async () => {}
      }),
      sync: async () => {},
      model: () => {},
      models: {}
    };
  }
};

// Create and export the connection
const sequelize = getConnection();

module.exports = sequelize;