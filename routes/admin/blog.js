
const express = require("express");
const router = express.Router();
const {
  getPosts,
  getPost,
  createPost,
  updatePost,
  deletePost,
} = require("../../controllers/admin/blogController");
const { authenticate, authorize } = require("../../middleware/auth");

// All routes in this file are protected and only accessible by admins
router.use(authenticate, authorize("admin"));

router.get("/posts", getPosts);
router.get("/posts/:id", getPost);
router.post("/posts", createPost);
router.put("/posts/:id", updatePost);
router.delete("/posts/:id", deletePost);

module.exports = router;
