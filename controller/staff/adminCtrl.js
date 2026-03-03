const AsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const Admin = require("../../model/Staff/Admin");
const Teacher = require("../../model/Staff/Teacher");
const Student = require("../../model/Academic/Student");
const Program = require("../../model/Academic/Program");
const Module = require("../../model/Academic/Module");
const generateToken = require("../../utils/generateToken");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const verifyToken = require("../../utils/verifyToken");

//@desc Register admin
//@route POST  api/v1/admins/register
//@acess Private

exports.registerAdminCtrl = AsyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  // Check if user already exists (ignore soft-deleted records)
  const existingUser = await Admin.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: false,
  });

  if (existingUser) {
    return res.status(409).json({
      message: "User with this email already exists",
    });
  }

  // Register user
  const user = await Admin.create({
    name,
    email: email.toLowerCase().trim(),
    password: await hashPassword(password),
  });

  res.status(201).json({
    status: "success",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  });
});

//@desc Login admin
//@route POST  api/v1/admins/login
//@acess Private

exports.loginAdminCtrl = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await Admin.findOne({ email });
  if (!user) {
    return res.json({ message: "Invalid ligin crendentials" });
  }

  const isMatched = await isPasswordMatched(password, user.password);

  if (!isMatched) {
    return res.json({ message: "Invalid ligin crendentials" });
  } else {
    return res.json({
      data: generateToken(user._id),
      message: "Admin Logged in  successful",
    });
  }
});

//@desc all admins
//@route GET  api/v1/admins
//@acess Private

exports.getAdminsCtrl = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted admins
  const admins = await Admin.find({ isDeleted: false });
  res.status(200).json({
    status: "success",
    data: admins,
    message: "All admins fetched successfully",
  });
});

//@desc single admin
//@route GET  api/v1/admins/:id
//@acess Private

exports.getAdminProfileCtrl = AsyncHandler(async (req, res) => {
  const admin = await Admin.findOne({
    _id: req.userAuth._id,
    isDeleted: false,
  })
    .select("-password -createdAt -updatedAt")
    .populate("academicYears")
    // .populate("academicTerms") // Vocational: academic terms not used
    .populate({
      path: "programs",
      match: { isDeleted: { $ne: true } }, // Exclude soft-deleted programs
    })
    .populate("yearGroups")
    .populate("classLevels");
  if (!admin) {
    return res.status(404).json({
      status: "failed",
      message: "Admin not found",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Admin profile fetched successfully",
    data: admin,
  });
});

//@desc update admin
//@route PUT  api/v1/admins/:id
//@acess Private

exports.updateAdminCtrl = AsyncHandler(async (req, res) => {
  // If body is empty or has no fields, return current user data
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const admin = await Admin.findOne({
      _id: req.userAuth._id,
      isDeleted: false,
    }).select("-password -createdAt -updatedAt");
    if (!admin) {
      return res.status(404).json({
        status: "failed",
        message: "Admin not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Admin profile fetched successfully",
      data: admin,
    });
  }

  const { email, password, name } = req.body;

  // Check if email already exists (only if email is being updated, ignore soft-deleted records)
  if (email) {
    const emailExist = await Admin.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id }, // Exclude current user
      isDeleted: false, // Ignore soft-deleted admins
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

    // Update admin with password
    const admin = await Admin.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: false },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!admin) {
      return res.status(404).json({
        status: "failed",
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: admin,
    });
  } else {
    // Build update object with only provided fields (no password)
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    // Update admin without password
    const admin = await Admin.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: false },
      updateData,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!admin) {
      return res.status(404).json({
        status: "failed",
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Admin updated successfully",
      data: admin,
    });
  }
});

//@desc delete admin
//@route DELETE  api/v1/admins/:id
//@acess Private

exports.deleteAdminCTRL = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const admin = await Admin.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!admin) {
    return res.status(404).json({
      status: "failed",
      message: "Admin not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Admin deleted successfully",
  });
});

//@desc suspend teacher
//@route PUT  api/v1/admins/suspend/teacher/:id
//@access Private admin only

const findTeacherQuery = (idParam) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);
  return isObjectId ? { _id: idParam } : { teacherId: idParam };
};

exports.adminSuspendTeacherCtrl = AsyncHandler(async (req, res) => {
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      message: "Teacher ID is required",
    });
  }
  const teacher = await Teacher.findOneAndUpdate(
    findTeacherQuery(idParam),
    { isSuspended: true },
    { new: true },
  );
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Teacher suspended successfully",
    data: teacher,
  });
});

//@desc unsuspend teacher
//@route PUT  api/v1/admins/unsuspend/teacher/:id
//@access Private admin only

exports.adminUnsupendTeacherCtrl = AsyncHandler(async (req, res) => {
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      message: "Teacher ID is required",
    });
  }
  const teacher = await Teacher.findOneAndUpdate(
    findTeacherQuery(idParam),
    { isSuspended: false },
    { new: true },
  );
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Teacher unsuspended successfully",
    data: teacher,
  });
});

//@desc withdraw teacher (permanently deletes from database)
//@route PUT  api/v1/admins/withdraw/teacher/:id
//@access Private admin only

exports.adminWithdrawTeacherCtrl = AsyncHandler(async (req, res) => {
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      message: "Teacher ID is required",
    });
  }
  const teacher = await Teacher.findOneAndDelete(findTeacherQuery(idParam));
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }
  const teacherObjId = teacher._id;
  await Admin.updateMany({}, { $pull: { teachers: teacherObjId } });
  await Program.updateMany({}, { $pull: { teachers: teacherObjId } });
  await Module.updateMany({}, { $pull: { teachers: teacherObjId } });

  res.status(200).json({
    status: "success",
    message: "Teacher withdrawn and permanently deleted from database",
    data: { id: teacherObjId.toString() },
  });
});

//@desc unwithdraw teacher (no longer applicable - teacher is deleted when withdrawn)
//@route PUT  api/v1/admins/unwithdraw/teacher/:id
//@access Private admin only

exports.adminUnwithdrawTeacherCtrl = AsyncHandler(async (req, res) => {
  res.status(400).json({
    status: "failed",
    message:
      "Cannot unwithdraw. Withdrawn teachers are permanently deleted. Register a new teacher if needed.",
  });
});

//@desc withdraw student (permanently deletes from database)
//@route PUT  api/v1/admins/withdraw/students/:id
//@access Private admin only

exports.adminWithdrawStudentCtrl = AsyncHandler(async (req, res) => {
  const studentId = req.params.id;
  const student = await Student.findByIdAndDelete(studentId);
  if (!student) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Student withdrawn and permanently deleted from database",
    data: { id: studentId },
  });
});

//@desc unwithdraw student (no longer applicable - student is deleted when withdrawn)
//@route PUT  api/v1/admins/unwithdraw/students/:id
//@access Private admin only

exports.adminUnwithdrawStudentCtrl = AsyncHandler(async (req, res) => {
  res.status(400).json({
    status: "failed",
    message:
      "Cannot unwithdraw. Withdrawn students are permanently deleted. Register a new student if needed.",
  });
});

//@desc publish exam
//@route PUT  api/v1/admins/publish/exam/:id
//@acess Private

exports.adminPublishExamCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin published teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};

//@desc unpublish exam
//@route PUT  api/v1/admins/unpublish/exam/:id
//@acess Private

exports.adminUnpublishExamCtrl = (req, res) => {
  try {
    res.status(201).json({
      status: "sucess",
      data: " admin unpublished teacher",
    });
  } catch (error) {
    res.json({
      status: "failed",
      error: error.message,
    });
  }
};
