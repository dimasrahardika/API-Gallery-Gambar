const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Image = sequelize.define('Image', {
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  description: DataTypes.TEXT,
  filename: {
    type: DataTypes.STRING,
    unique: true
  },
  url: DataTypes.STRING,
  thumbnailUrl: DataTypes.STRING,
  tags: DataTypes.JSON,
  size: DataTypes.INTEGER,
  width: DataTypes.INTEGER,
  height: DataTypes.INTEGER
}, {
  timestamps: true
});

module.exports = Image;