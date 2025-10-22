const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const CartItem = sequelize.define(
    "CartItem",
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
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
        validate: {
          min: 1,
        },
      },
    },
    {
      tableName: "cart_items",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        {
          unique: true,
          fields: ["user_id", "product_id"],
        },
      ],
    },
  )

  return CartItem
}
