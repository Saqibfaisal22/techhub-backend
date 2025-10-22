const { Sequelize } = require("sequelize")
const config = require("../config/database")

const env = process.env.NODE_ENV || "development"
const dbConfig = config[env]

// const sequelize = new Sequelize(dbConfig.database, dbConfig.username, dbConfig.password, {
//   host: dbConfig.host,
//   port: dbConfig.port,
//   dialect: dbConfig.dialect,
//   logging: dbConfig.logging,
//   pool: dbConfig.pool,
// })

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "mysql",
  logging: false,
});
// Import models
const User = require("./User")(sequelize)
const UserAddress = require("./UserAddress")(sequelize)
const Category = require("./Category")(sequelize)
const Brand = require("./Brand")(sequelize)
const Product = require("./Product")(sequelize)
const ProductImage = require("./ProductImage")(sequelize)
const ProductAttribute = require("./ProductAttribute")(sequelize)
const CartItem = require("./CartItem")(sequelize)
const WishlistItem = require("./WishlistItem")(sequelize)
const Order = require("./Order")(sequelize)
const OrderItem = require("./OrderItem")(sequelize)
const OrderAddress = require("./OrderAddress")(sequelize)
const OrderTracking = require("./OrderTracking")(sequelize)
const Page = require("./Page")(sequelize)
const BlogPost = require("./BlogPost")(sequelize)
const SupportTicket = require("./SupportTicket")(sequelize)
const SupportTicketReply = require("./SupportTicketReply")(sequelize)
const SupportTicketAttachment = require("./SupportTicketAttachment")(sequelize)
const Media = require("./Media")(sequelize)

// Define associations
const models = {
  User,
  UserAddress,
  Category,
  Brand,
  Product,
  ProductImage,
  ProductAttribute,
  CartItem,
  WishlistItem,
  Order,
  OrderItem,
  OrderAddress,
  OrderTracking,
  Page,
  BlogPost,
  SupportTicket,
  SupportTicketReply,
  SupportTicketAttachment,
  Media,
}

// User associations
User.hasMany(UserAddress, { foreignKey: "user_id", as: "addresses" })
User.hasMany(CartItem, { foreignKey: "user_id", as: "cartItems" })
User.hasMany(WishlistItem, { foreignKey: "user_id", as: "wishlistItems" })
User.hasMany(Order, { foreignKey: "user_id", as: "orders" })
User.hasMany(BlogPost, { foreignKey: "author_id", as: "blogPosts" })
User.hasMany(SupportTicket, { foreignKey: "user_id", as: "supportTickets" })

// Category associations
Category.hasMany(Category, { foreignKey: "parent_id", as: "children" })
Category.belongsTo(Category, { foreignKey: "parent_id", as: "parent" })
Category.hasMany(Product, { foreignKey: "category_id", as: "products" })

// Brand associations
Brand.hasMany(Product, { foreignKey: "brand_id", as: "products" })

// Product associations
Product.belongsTo(Category, { foreignKey: "category_id", as: "category" })
Product.belongsTo(Brand, { foreignKey: "brand_id", as: "brand" })
Product.hasMany(ProductImage, { foreignKey: "product_id", as: "images" })
Product.hasMany(ProductAttribute, { foreignKey: "product_id", as: "attributes" })
Product.hasMany(CartItem, { foreignKey: "product_id", as: "cartItems" })
Product.hasMany(WishlistItem, { foreignKey: "product_id", as: "wishlistItems" })
Product.hasMany(OrderItem, { foreignKey: "product_id", as: "orderItems" })

// Cart associations
CartItem.belongsTo(User, { foreignKey: "user_id", as: "user" })
CartItem.belongsTo(Product, { foreignKey: "product_id", as: "product" })

// Wishlist associations
WishlistItem.belongsTo(User, { foreignKey: "user_id", as: "user" })
WishlistItem.belongsTo(Product, { foreignKey: "product_id", as: "product" })

// Order associations
Order.belongsTo(User, { foreignKey: "user_id", as: "user" })
Order.hasMany(OrderItem, { foreignKey: "order_id", as: "items" })
Order.hasMany(OrderAddress, { foreignKey: "order_id", as: "addresses" })
Order.hasMany(OrderTracking, { foreignKey: "order_id", as: "tracking" })

// Order item associations
OrderItem.belongsTo(Order, { foreignKey: "order_id", as: "order" })
OrderItem.belongsTo(Product, { foreignKey: "product_id", as: "product" })

// Support ticket associations
SupportTicket.belongsTo(User, { foreignKey: "user_id", as: "user" })
SupportTicket.belongsTo(User, { foreignKey: "assigned_to", as: "assignedUser" })
SupportTicket.hasMany(SupportTicketReply, { foreignKey: "ticket_id", as: "replies" })
SupportTicket.hasMany(SupportTicketAttachment, { foreignKey: "ticket_id", as: "attachments" })

// Support ticket reply associations
SupportTicketReply.belongsTo(SupportTicket, { foreignKey: "ticket_id", as: "ticket" })
SupportTicketReply.belongsTo(User, { foreignKey: "user_id", as: "user" })
SupportTicketReply.hasMany(SupportTicketAttachment, { foreignKey: "reply_id", as: "attachments" })

// Blog post associations
BlogPost.belongsTo(User, { foreignKey: "author_id", as: "author" })

module.exports = {
  sequelize,
  ...models,
}
