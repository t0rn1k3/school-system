const verifyToken = require("../utils/verifyToken");
const Student = require("../model/Academic/Student");

const isStudentLogin = async (req, res, next) => {
  try {
    // get token from header
    const headerObj = req.headers;
    const token = headerObj?.authorization?.split(" ")[1];

    // Check if token exists
    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. No token provided.",
      });
    }

    //verify token
    const verify = verifyToken(token);
    if (!verify) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Invalid token.",
      });
    }

    //find student
    const user = await Student.findOne({
      _id: verify.id,
      isDeleted: { $ne: true }, // Ignore soft-deleted students
    }).select("name email studentId");

    if (!user) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Student not found.",
      });
    }

    //save user id in req.obj
    req.userAuth = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Authentication failed.",
      error: error.message,
    });
  }
};

module.exports = isStudentLogin;
