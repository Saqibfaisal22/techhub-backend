const { DataTypes } = require("sequelize")
const bcrypt = require("bcryptjs")

module.exports = (sequelize) => {
  const User = sequelize.define(
    "User",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      first_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      last_name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING(20),
        allowNull: true,
      },
      role: {
        type: DataTypes.ENUM("customer", "admin"),
        defaultValue: "customer",
      },
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      email_verification_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password_reset_token: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      password_reset_expires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    {
      tableName: "users",
      timestamps: true,
      createdAt: "created_at",
      updatedAt: "updated_at",
      hooks: {
        beforeCreate: async (user) => {
          if (user.password) {
            user.password = await bcrypt.hash(user.password, 12)
          }
        },
        beforeUpdate: async (user) => {
          if (user.changed("password")) {
            user.password = await bcrypt.hash(user.password, 12)
          }
        },
      },
    },
  )

  // Instance methods
  User.prototype.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password)
  }

  User.prototype.toJSON = function () {
    const values = Object.assign({}, this.get())
    delete values.password
    delete values.password_reset_token
    delete values.email_verification_token
    return values
  }

  return User
}
