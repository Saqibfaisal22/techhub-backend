const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const ProductImage = sequelize.define(
    "ProductImage",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
      image_url: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      alt_text: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      is_primary: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "product_images",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return ProductImage
}
