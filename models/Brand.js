const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Brand = sequelize.define(
    "Brand",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      logo_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      website_url: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "brands",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return Brand
}
