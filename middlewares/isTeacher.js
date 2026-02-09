const Teacher = require("../model/Staff/Teacher");
const mongoose = require("mongoose");

const isTeacher = async (req, res, next) => {
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

    const teacherFound = await Teacher.findOne({
      _id: userId,
      isDeleted: { $ne: true }, // Ignore soft-deleted teachers
    });

    // Check teacher
    if (teacherFound?.role === "teacher") {
      next();
    } else {
      return res.status(403).json({
        status: "failed",
        message: "You are not authorized to access this resource as a teacher",
      });
    }
  } catch (error) {
    return res.status(500).json({
      status: "failed",
      message: "Error checking teacher authorization",
      error: error.message,
    });
  }
};

module.exports = isTeacher;
