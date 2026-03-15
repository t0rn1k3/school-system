const verifyToken = require("../utils/verifyToken");
const Admin = require("../model/Staff/Admin");
const Teacher = require("../model/Staff/Teacher");
const TeacherLogin = require("../model/Registry/TeacherLogin");
const { getTenantModels } = require("../utils/tenantConnection");
const authCache = require("../utils/authCache");

/**
 * Allows either Admin or Teacher to access the route.
 * Supports database-per-tenant: Admin has schoolDbName; Teacher resolved via TeacherLogin registry.
 */
const isTeacherOrAdmin = async (req, res, next) => {
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

    // Try Admin: tenant DB first (schoolDbName in token), then default DB
    let admin;
    if (verify.schoolDbName) {
      const models = getTenantModels(verify.schoolDbName);
      admin = models?.Admin && await models.Admin.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      })
        .select("name email role schoolDbName schoolName")
        .lean();
    }
    if (!admin) {
      admin = await Admin.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      })
        .select("name email role schoolDbName schoolName")
        .lean();
    }

    if (admin) {
      authCache.set(token, admin);
      req.userAuth = admin;
      return next();
    }

    // Try Teacher: tenant DB first (schoolDbName in token), then registry lookup, then default DB
    let teacher;
    if (verify.schoolDbName) {
      const models = getTenantModels(verify.schoolDbName);
      teacher = models?.Teacher && await models.Teacher.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      })
        .select("name email role")
        .lean();
      if (teacher) {
        teacher = { ...teacher, schoolDbName: verify.schoolDbName };
      }
    }

    if (!teacher) {
      const loginEntry = await TeacherLogin.findOne({ teacherId: verify.id });
      if (loginEntry) {
        const models = getTenantModels(loginEntry.schoolDbName);
        const found = models?.Teacher && await models.Teacher.findOne({
          _id: verify.id,
          isDeleted: { $ne: true },
        })
          .select("name email role")
          .lean();
        if (found) {
          teacher = { ...found, schoolDbName: loginEntry.schoolDbName };
        }
      }
    }

    if (!teacher) {
      teacher = await Teacher.findOne({
        _id: verify.id,
        isDeleted: { $ne: true },
      })
        .select("name email role")
        .lean();
    }

    if (teacher) {
      authCache.set(token, teacher);
      req.userAuth = teacher;
      return next();
    }

    return res.status(401).json({
      status: "failed",
      message: "Access denied. User not found.",
    });
  } catch (error) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Authentication failed.",
      error: error.message,
    });
  }
};

module.exports = isTeacherOrAdmin;
