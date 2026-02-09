const AsyncHandler = require("express-async-handler");
const Teacher = require("../../model/Staff/Teacher");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");

//@desc register teacher
//@route POST /api/v1/teachers/admin/register
//@access Private

exports.adminRegisterTeacherCtrl = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      status: "failed",
      message: "Name, email, and password are required fields",
    });
  }

  //check if the teacher already exists
  const teacher = await Teacher.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: { $ne: true }, // Ignore soft-deleted teachers
  });
  if (teacher) {
    return res.status(409).json({
      status: "failed",
      message: "Teacher already exists",
    });
  }

  //hash password
  const hashedPassword = await hashPassword(password);

  //create teacher
  const teacherCreated = await Teacher.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  });

  // send teacher data

  res.status(201).json({
    status: "success",
    message: "Teacher created successfully",
    data: teacherCreated,
  });
});
