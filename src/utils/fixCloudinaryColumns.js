const sequelize = require('../config/database');

async function removeCloudinaryColumns() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    
    // Check if the columns exist before trying to remove them
    try {
      console.log('Removing cloudinary_id column...');
      await queryInterface.removeColumn('Images', 'cloudinary_id');
      console.log('cloudinary_id column removed successfully');
    } catch (error) {
      console.log('Failed to remove cloudinary_id column:', error.message);
    }
    
    try {
      console.log('Removing publicId column...');
      await queryInterface.removeColumn('Images', 'publicId');
      console.log('publicId column removed successfully');
    } catch (error) {
      console.log('Failed to remove publicId column:', error.message);
    }

    console.log('Database schema update complete!');
    await sequelize.close();
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
}

removeCloudinaryColumns();