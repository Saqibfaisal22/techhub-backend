const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Media = sequelize.define(
    "Media",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      original_name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      mimetype: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      alt_text: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
    },
    {
      tableName: "media",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return Media
}