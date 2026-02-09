const Admin = require("../model/Staff/Admin");
const mongoose = require("mongoose");

const isAdmin = async (req, res, next) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "failed",
        message: "Database connection not available. Please try again later.",
      });
    }

    // Find user
    const userId = req.userAuth._id;
    if (!userId) {
      return res.status(401).json({
        status: "failed",
        message: "User authentication required",
      });
    }

    const adminFound = await Admin.findById(userId);

    // Check admin
    if (adminFound?.role === "admin") {
      next();
    } else {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to access this resource",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Error checking admin authorization",
      error: error.message,
    });
  }
};

module.exports = isAdmin;
