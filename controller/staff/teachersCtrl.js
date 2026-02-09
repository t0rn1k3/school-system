const AsyncHandler = require("express-async-handler");
const Teacher = require("../../model/Staff/Teacher");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const generateToken = require("../../utils/generateToken");

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

//@dec teacher login
//@route POST /api/v1/teachers/login
//@access Private

exports.teacherLoginCtrl = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //find the user

  const teacher = await Teacher.findOne({ email });
  if (!teacher) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid email or password",
    });
  }

  const isMatched = await isPasswordMatched(password, teacher.password);

  if (!isMatched) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid email or password",
    });
  } else {
    return res.status(200).json({
      status: "success",
      message: "Teacher logged in successfully",
      data: generateToken(teacher._id),
    });
  }
});

//@dec get all teachers
//@route GET /api/v1/teachers/
//@access Private admins only

exports.getTeachersCtrl = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted teachers (handle documents without isDeleted field)
  const teachers = await Teacher.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  res.status(200).json({
    status: "success",
    data: teachers,
    message: "All teachers fetched successfully",
  });
});

//@dec get single teacher
//@route GET /api/v1/teachers/:teacherId/admin
//@access Private admins only

exports.getSingleTeacherCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId;
  const teacher = await Teacher.findById(teacherId);
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: teacher,
    message: "Teacher fetched successfully",
  });
});
