const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Product = sequelize.define(
    "Product",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        // unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      short_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        // unique: true,
      },
      model: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      brand_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "brands",
          key: "id",
        },
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "categories",
          key: "id",
        },
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      compare_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      cost_price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: true,
      },
      stock_quantity: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
      },
      min_stock_level: {
        type: DataTypes.INTEGER,
        defaultValue: 5,
      },
      weight: {
        type: DataTypes.DECIMAL(8, 2),
        allowNull: true,
      },
      dimensions: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("active", "inactive", "draft"),
        defaultValue: "active",
      },
      featured: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      meta_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
    },
    {
      tableName: "products",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return Product
}
