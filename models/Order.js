const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Order = sequelize.define(
    "Order",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_number: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("pending", "processing", "shipped", "delivered", "cancelled", "refunded"),
        defaultValue: "pending",
      },
      payment_status: {
        type: DataTypes.ENUM("pending", "paid", "failed", "refunded", "cancelled"),
        defaultValue: "pending",
      },
      payment_method: {
        type: DataTypes.STRING(50),
        allowNull: true,
      },
      payment_reference: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      stripe_payment_id: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      tax_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      shipping_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      discount_amount: {
        type: DataTypes.DECIMAL(10, 2),
        defaultValue: 0,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      currency: {
        type: DataTypes.STRING(3),
        defaultValue: "USD",
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      shipped_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      delivered_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: "orders",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return Order
}
