const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const Page = sequelize.define(
    "Page",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
      },
      content: {
        type: DataTypes.TEXT("long"),
        allowNull: true,
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM("published", "draft"),
        defaultValue: "published",
      },
      meta_title: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      meta_description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: "pages",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return Page
}
