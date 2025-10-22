const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const OrderAddress = sequelize.define(
    "OrderAddress",
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
      type: {
        type: DataTypes.ENUM("billing", "shipping"),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      company: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      street_address: {
        type: DataTypes.STRING(255),
        allowNull: false,
        field: "address_line_1", // Maps to address_line_1 in DB
      },
      address_line_2: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      city: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      state: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      zip_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
        field: "postal_code", // Maps to postal_code in DB
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
    },
    {
      tableName: "order_addresses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return OrderAddress
}
