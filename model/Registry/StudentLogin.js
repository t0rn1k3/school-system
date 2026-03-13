/**
 * Registry: maps studentId -> school (for login).
 * Lives in default "lms" database.
 * When admin creates a student in their tenant DB, we add an entry here.
 */
const mongoose = require("mongoose");

const studentLoginSchema = new mongoose.Schema(
  {
    studentId: { type: String, required: true, unique: true },
    schoolDbName: { type: String, required: true },
    studentObjectId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);

const StudentLogin = mongoose.model("StudentLogin", studentLoginSchema);
module.exports = StudentLogin;
