/**
 * isAdmin middleware.
 * Runs AFTER isLogin, which already verified the user exists (in tenant or default DB)
 * and set req.userAuth with role. No extra DB query needed.
 */
const isAdmin = (req, res, next) => {
  if (!req.userAuth || !req.userAuth._id) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Admin authentication required",
    });
  }

  if (req.userAuth.role === "admin") {
    return next();
  }

  return res.status(403).json({
    status: "failed",
    message: "You are not authorized to access this resource",
  });
};

module.exports = isAdmin;
