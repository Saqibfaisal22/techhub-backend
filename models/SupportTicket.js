const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const SupportTicket = sequelize.define(
    "SupportTicket",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_number: {
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
      subject: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      priority: {
        type: DataTypes.ENUM("low", "medium", "high", "urgent"),
        defaultValue: "medium",
      },
      status: {
        type: DataTypes.ENUM("open", "in_progress", "resolved", "closed"),
        defaultValue: "open",
      },
      assigned_to: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "users",
          key: "id",
        },
      },
    },
    {
      tableName: "support_tickets",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return SupportTicket
}
