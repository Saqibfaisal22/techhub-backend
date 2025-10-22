
const express = require("express");
const router = express.Router();

// Import admin routes
const analyticsRoutes = require("./analytics");
const authRoutes = require("./auth");
const userRoutes = require("./users");
const productRoutes = require("./products");
const orderRoutes = require("./orders");
const ticketRoutes = require("./tickets");
const cmsRoutes = require("./cms");
const blogRoutes = require("./blog");
const categoryRoutes = require("./categories");
const brandRoutes = require("./brands");

// Mount admin routes
router.use("/analytics", analyticsRoutes);
router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/products", productRoutes);
router.use("/categories", categoryRoutes);
router.use("/brands", brandRoutes);
router.use("/orders", orderRoutes);
router.use("/tickets", ticketRoutes);
router.use("/cms", cmsRoutes);
router.use("/blog", blogRoutes);

module.exports = router;
