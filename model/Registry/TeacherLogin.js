/**
 * Registry: maps teacher email -> school (for login).
 * Lives in default "lms" database.
 * When admin creates a teacher in their tenant DB, we add an entry here.
 */
const mongoose = require("mongoose");

const teacherLoginSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    schoolDbName: { type: String, required: true },
    teacherId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
teacherLoginSchema.index({ teacherId: 1 });

const TeacherLogin = mongoose.model("TeacherLogin", teacherLoginSchema);
module.exports = TeacherLogin;
