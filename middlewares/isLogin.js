const verifyToken = require("../utils/verifyToken");
const Admin = require("../model/Staff/Admin");
const { getTenantModels } = require("../utils/tenantConnection");

const isLogin = async (req, res, next) => {
  try {
    const headerObj = req.headers;
    const token = headerObj?.authorization?.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        status: "failed",
        messageKey: "auth.no_token",
        message: "Access denied. No token provided.",
      });
    }

    const verify = verifyToken(token);
    if (!verify) {
      return res.status(401).json({
        status: "failed",
        messageKey: "auth.invalid_token",
        message: "Access denied. Invalid token.",
      });
    }

    let user;
    if (verify.schoolDbName) {
      const models = getTenantModels(verify.schoolDbName);
      user = models?.Admin && await models.Admin.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      }).select("name email role schoolDbName schoolName");
    }
    if (!user) {
      user = await Admin.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      }).select("name email role schoolDbName schoolName");
    }

    if (!user) {
      return res.status(401).json({
        status: "failed",
        messageKey: "auth.user_not_found",
        message: "Access denied. User not found.",
      });
    }

    //save user id in req.obj
    req.userAuth = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: "failed",
      messageKey: "auth.auth_failed",
      message: "Access denied. Authentication failed.",
      error: error.message,
    });
  }
};

module.exports = isLogin;
