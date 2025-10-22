const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const SupportTicketAttachment = sequelize.define(
    "SupportTicketAttachment",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      ticket_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "support_tickets",
          key: "id",
        },
      },
      reply_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: "support_ticket_replies",
          key: "id",
        },
      },
      filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      original_filename: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      file_path: {
        type: DataTypes.STRING(500),
        allowNull: false,
      },
      file_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      mime_type: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
    },
    {
      tableName: "support_ticket_attachments",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: false,
    },
  )

  return SupportTicketAttachment
}
