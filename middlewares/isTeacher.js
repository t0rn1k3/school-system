/**
 * isTeacher middleware.
 * Runs AFTER isTeacherLogin (or isTeacherOrAdmin), which already verified the user
 * exists (in tenant or default DB) and set req.userAuth with role.
 */
const isTeacher = (req, res, next) => {
  if (!req.userAuth || !req.userAuth._id) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Invalid or missing authentication token.",
    });
  }

  if (req.userAuth.role === "teacher") {
    return next();
  }

  return res.status(403).json({
    status: "failed",
    message: "You are not authorized to access this resource as a teacher",
  });
};

module.exports = isTeacher;
