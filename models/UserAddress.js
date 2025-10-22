const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const UserAddress = sequelize.define(
    "UserAddress",
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
      type: {
        type: DataTypes.ENUM("billing", "shipping"),
        defaultValue: "shipping",
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      company: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      address_line_1: {
        type: DataTypes.STRING(255),
        allowNull: false,
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
      postal_code: {
        type: DataTypes.STRING(20),
        allowNull: false,
      },
      country: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "user_addresses",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return UserAddress
}
