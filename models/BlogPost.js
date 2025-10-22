const { DataTypes } = require("sequelize")

module.exports = (sequelize) => {
  const BlogPost = sequelize.define(
    "BlogPost",
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
        allowNull: false,
      },
      excerpt: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      featured_image: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      author_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "users",
          key: "id",
        },
      },
      status: {
        type: DataTypes.ENUM("published", "draft"),
        defaultValue: "draft",
      },
      published_at: {
        type: DataTypes.DATE,
        allowNull: true,
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
      tableName: "blog_posts",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  )

  return BlogPost
}
