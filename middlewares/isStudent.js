const Student = require("../model/Academic/Student");
const mongoose = require("mongoose");

const isStudent = async (req, res, next) => {
  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        status: "failed",
        message: "Database connection not available. Please try again later.",
      });
    }

    // Check if user is authenticated first
    if (!req.userAuth || !req.userAuth._id) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Invalid or missing authentication token.",
      });
    }

    // Find user
    const userId = req.userAuth._id;

    const studentFound = await Student.findOne({
      _id: userId,
      isDeleted: { $ne: true }, // Ignore soft-deleted students
    });

    // Check teacher
    if (studentFound?.role === "student") {
      next();
    } else {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to access this resource as a student",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Error checking student authorization",
      error: error.message,
    });
  }
};

module.exports = isStudent;
