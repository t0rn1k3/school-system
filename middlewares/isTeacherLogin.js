const verifyToken = require("../utils/verifyToken");
const Teacher = require("../model/Staff/Teacher");
const authCache = require("../utils/authCache");

const isTeacherLogin = async (req, res, next) => {
  try {
    const headerObj = req.headers;
    const token = headerObj?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. No token provided.",
      });
    }

    const verify = verifyToken(token);
    if (!verify) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Invalid token.",
      });
    }

    const cached = authCache.get(token);
    if (cached) {
      req.userAuth = cached;
      return next();
    }

    const user = await Teacher.findOne({
      _id: verify.id,
      isDeleted: { $ne: true },
    })
      .select("name email role")
      .lean();

    if (!user) {
      return res.status(401).json({
        status: "failed",
        message: "Access denied. Teacher not found.",
      });
    }

    authCache.set(token, user);
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

module.exports = isTeacherLogin;
