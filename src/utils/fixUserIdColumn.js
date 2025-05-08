const sequelize = require('../config/database');

async function removeUserIdColumn() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connection established successfully.');

    const queryInterface = sequelize.getQueryInterface();
    
    // Try to remove userId column
    try {
      console.log('Removing userId column from Images table...');
      await queryInterface.removeColumn('Images', 'userId');
      console.log('userId column removed successfully');
    } catch (error) {
      console.log('Failed to remove userId column:', error.message);
    }

    console.log('Database schema update complete!');
    await sequelize.close();
  } catch (error) {
    console.error('Error updating database schema:', error);
  }
}

removeUserIdColumn();