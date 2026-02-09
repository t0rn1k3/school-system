const verifyToken = require("../utils/verifyToken");
const Admin = require("../model/Staff/Admin");

const isLogin = async (req, res, next) => {
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

    //find admin
    const user = await Admin.findOne({
      _id: verify.id,
      isDeleted: { $ne: true }, // Ignore soft-deleted admins
    }).select("name email role");

    if (!user) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. User not found.",
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

module.exports = isLogin;
