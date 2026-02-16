const AsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const Teacher = require("../../model/Staff/Teacher");
const Admin = require("../../model/Staff/Admin");
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
  // find admin
  const adminFound = await Admin.findById(req.userAuth._id);
  if (!adminFound) {
    return res.status(404).json({
      status: "failed",
      message: "Admin not found",
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

  //push to the admin
  adminFound.teachers.push(teacherCreated._id);
  await adminFound.save();

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
  //convert query strings to numbers
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  // Only fetch non-deleted teachers (handle documents without isDeleted field)
  const teachers = await Teacher.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  })
    .skip(skip)
    .limit(limit);

  //get total number of teachers
  const totalTeachers = await Teacher.countDocuments({
    isDeleted: { $ne: true },
  });
  res.status(200).json({
    status: "success",
    data: teachers,
    totalTeachers,
    results: teachers.length,
    message: "All teachers fetched successfully",
  });
});

//@dec get single teacher
//@route GET /api/v1/teachers/:teacherId/admin
//@access Private admins only

exports.getSingleTeacherCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId;
  const teacher = await Teacher.findOne({
    _id: teacherId,
    isDeleted: { $ne: true },
  });
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

//@dec teacher profile
//@route GET /api/v1/teachers/profile
//@access Private teachers only

exports.getTeacherProfileCtrl = AsyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  }).select("-password -createdAt -updatedAt");
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: teacher,
    message: "Teacher profile fetched successfully",
  });
});

//@dec update teacher profile
//@route PUT /api/v1/teachers/:teacherId/update
//@access Private teachers only

exports.updateTeacherProfileCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId;

  // Verify that the teacher can only update their own profile
  if (teacherId !== req.userAuth._id.toString()) {
    return res.status(403).json({
      status: "failed",
      message: "You can only update your own profile",
    });
  }

  // If body is empty or has no fields, return current user data
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const teacher = await Teacher.findOne({
      _id: req.userAuth._id,
      isDeleted: { $ne: true },
    }).select("-password -createdAt -updatedAt");
    if (!teacher) {
      return res.status(404).json({
        status: "failed",
        message: "Teacher not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Teacher profile fetched successfully",
      data: teacher,
    });
  }

  const { email, password, name } = req.body;

  // Check if email already exists (only if email is being updated, ignore soft-deleted records)
  if (email) {
    const emailExist = await Teacher.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id }, // Exclude current user
      isDeleted: { $ne: true }, // Ignore soft-deleted teachers
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        message: "Email already exists",
      });
    }
  }

  //check if user is updating password
  if (password) {
    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Build update object with only provided fields
    const updateData = { password: hashedPassword };
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    // Update teacher with password
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!teacher) {
      return res.status(404).json({
        status: "failed",
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Teacher updated successfully",
      data: teacher,
    });
  } else {
    // Build update object with only provided fields (no password)
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    // Update teacher without password
    const teacher = await Teacher.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!teacher) {
      return res.status(404).json({
        status: "failed",
        message: "Teacher not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Teacher updated successfully",
      data: teacher,
    });
  }
});

//@des admin update teacher profile
//@route PUT /api/v1/teachers/:teacherId/admin
//@access Private admins only

exports.adminUpdateTeacher = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { program, classLevel, academicYear, subject, name, email } = req.body;
  const teacherId = req.params.teacherId; // Fixed: was teacherID (wrong case)

  // Find teacher (ignore soft-deleted)
  const teacherFound = await Teacher.findOne({
    _id: teacherId,
    isDeleted: { $ne: true },
  });

  if (!teacherFound) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }

  // Check if teacher is withdrawn
  if (teacherFound.isWithdrawn) {
    return res.status(403).json({
      status: "failed",
      message: "Action denied, teacher is withdrawn",
    });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (program !== undefined) updateData.program = program;
  if (classLevel !== undefined) updateData.classLevel = classLevel;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (subject !== undefined) updateData.subject = subject;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    // Check if email already exists (if email is being updated)
    const emailExist = await Teacher.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: teacherId },
      isDeleted: { $ne: true },
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        message: "Email already exists",
      });
    }
    updateData.email = email.toLowerCase().trim();
  }

  // If no fields to update, return current teacher data
  if (Object.keys(updateData).length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No fields to update",
      data: teacherFound,
    });
  }

  // Update teacher with all fields at once
  const updatedTeacher = await Teacher.findByIdAndUpdate(
    teacherId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  res.status(200).json({
    status: "success",
    data: updatedTeacher,
    message: "Teacher updated successfully",
  });
});
