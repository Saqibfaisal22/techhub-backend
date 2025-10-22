const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const WishlistItem = sequelize.define(
    "WishlistItem",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "products",
          key: "id",
        },
      },
    },
    {
      tableName: "wishlist_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
      indexes: [
        {
          unique: true,
          fields: ["user_id", "product_id"],
        },
      ],
    },
  )

  return WishlistItem
}
