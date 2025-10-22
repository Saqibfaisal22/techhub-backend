const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const ProductAttribute = sequelize.define(
    "ProductAttribute",
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
      attribute_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      attribute_value: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      sort_order: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
    },
    {
      tableName: "product_attributes",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return ProductAttribute
}
