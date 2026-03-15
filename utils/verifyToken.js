const jwt = require("jsonwebtoken");

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "anykey");
  } catch {
    return false;
  }
};

module.exports = verifyToken;
