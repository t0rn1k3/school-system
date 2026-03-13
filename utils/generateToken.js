const jwt = require("jsonwebtoken");

/**
 * @param {string} id - User ID
 * @param {Object} [payload] - Additional payload (e.g. { schoolDbName } for admin)
 */
const generateToken = (id, payload = {}) => {
  return jwt.sign({ id, ...payload }, process.env.JWT_SECRET || "anykey", {
    expiresIn: process.env.JWT_EXPIRE || "5d",
  });
};

module.exports = generateToken;
