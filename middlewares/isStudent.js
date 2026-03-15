/**
 * isStudent middleware.
 * Runs AFTER isStudentLogin, which already verified the user exists
 * (in tenant or default DB) and set req.userAuth with role.
 */
const isStudent = (req, res, next) => {
  if (!req.userAuth || !req.userAuth._id) {
    return res.status(401).json({
      status: "failed",
      message: "Access denied. Invalid or missing authentication token.",
    });
  }

  if (req.userAuth.role === "student") {
    return next();
  }

  return res.status(403).json({
    status: "failed",
    message: "You are not authorized to access this resource as a student",
  });
};

module.exports = isStudent;
