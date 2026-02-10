const AsyncHandler = require("express-async-handler");
const Student = require("../../model/Academic/Student");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const generateToken = require("../../utils/generateToken");

//@desc Register student
//@route POST /api/v1/students/admin/register
//@access Private admin only

exports.adminRegisterStudentCtrl = AsyncHandler(async (req, res) => {
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

  //check if the student already exists
  const student = await Student.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: { $ne: true }, // Ignore soft-deleted students
  });
  if (student) {
    return res.status(409).json({
      status: "failed",
      message: "Student already exists",
    });
  }

  //hash password
  const hashedPassword = await hashPassword(password);

  //create student
  const studentCreated = await Student.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  });

  // send student data

  res.status(201).json({
    status: "success",
    message: "Student created successfully",
    data: studentCreated,
  });
});

//@dec student login
//@route POST /api/v1/students/login
//@access Private

exports.studentLoginCtrl = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  //find the user

  const student = await Student.findOne({ email });
  if (!student) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid email or password",
    });
  }

  const isMatched = await isPasswordMatched(password, student.password);

  if (!isMatched) {
    return res.status(401).json({
      status: "failed",
      message: "Invalid email or password",
    });
  } else {
    return res.status(200).json({
      status: "success",
      message: "Student logged in successfully",
      data: generateToken(student._id),
    });
  }
});
