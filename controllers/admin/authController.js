
const asyncHandler = require("express-async-handler");
const { User } = require("../../models");
const { generateToken } = require("../../utils/jwt");

// @desc    Login admin user
// @route   POST /api/admin/auth/login
// @access  Public
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400);
    throw new Error("Please provide email and password");
  }

  const user = await User.findOne({ where: { email } });

  if (user && (await user.matchPassword(password))) {
    if (user.role !== "admin") {
      res.status(403);
      throw new Error("Not authorized as an admin");
    }

    res.json({
      success: true,
      token: generateToken(user.id),
      admin: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } else {
    res.status(401);
    throw new Error("Invalid credentials");
  }
});

module.exports = {
  login,
};
