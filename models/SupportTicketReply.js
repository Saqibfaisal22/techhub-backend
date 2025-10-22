const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const SupportTicketReply = sequelize.define(
    "SupportTicketReply",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "support_tickets",
          key: "id",
        },
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      message: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      is_internal: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: "support_ticket_replies",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return SupportTicketReply
}
