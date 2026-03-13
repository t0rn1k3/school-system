/**
 * Login registry: maps admin email → school database.
 * Lives in default "lms" database (minimal routing only).
 * Admin documents live in their school DB; this is only for login lookup.
 */
const mongoose = require("mongoose");

const adminLoginSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    schoolDbName: { type: String, required: true },
  },
  { timestamps: true }
);

const AdminLogin = mongoose.model("AdminLogin", adminLoginSchema);
module.exports = AdminLogin;
