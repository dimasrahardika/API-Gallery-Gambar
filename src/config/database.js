const { Sequelize } = require('sequelize');
require('dotenv').config();

// Better error handling for Vercel deployment
let sequelize;

try {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'gallery_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASSWORD || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      port: process.env.DB_PORT || 3306,
      logging: false,
      dialectOptions: {
        // Additional options for cloud database connections
        ssl: process.env.DB_SSL === 'true' ? {
          require: true,
          rejectUnauthorized: false
        } : false
      },
      // Connection pool settings for serverless environment
      pool: {
        max: 2,
        min: 0,
        idle: 10000
      }
    }
  );
  
  console.log(`Database connection initialized to: ${process.env.DB_HOST || 'localhost'}`);
} catch (error) {
  console.error('Failed to initialize database connection:', error);
}

module.exports = sequelize;