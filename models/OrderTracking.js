const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const OrderTracking = sequelize.define(
    "OrderTracking",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "orders",
          key: "id",
        },
      },
      status: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      tracking_number: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      carrier: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
    },
    {
      tableName: "order_tracking",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return OrderTracking
}
