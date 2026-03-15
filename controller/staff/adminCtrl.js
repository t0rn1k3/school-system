const AsyncHandler = require("express-async-handler");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const Admin = require("../../model/Staff/Admin");
const AdminLogin = require("../../model/Registry/AdminLogin");
const generateToken = require("../../utils/generateToken");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const verifyToken = require("../../utils/verifyToken");
const { bootstrapSchoolDatabase, getTenantModels } = require("../../utils/tenantConnection");
const { buildSchoolDbName } = require("../../utils/schoolDbName");
const getModel = require("../../utils/getModel");

//@desc Register admin
//@route POST  api/v1/admins/register
//@acess Private

exports.registerAdminCtrl = AsyncHandler(async (req, res) => {
  const { name, email, password, schoolName } = req.body;

  // Validate input
  if (!name || !email || !password) {
    return res.status(400).json({
      message: "All fields are required",
    });
  }

  const emailNorm = email.toLowerCase().trim();

  // Check if email already taken (registry + legacy lms)
  const existingLogin = await AdminLogin.findOne({ email: emailNorm });
  if (existingLogin) {
    return res.status(409).json({
      status: "failed",
      message: "User with this email already exists",
    });
  }
  const existingLegacy = await Admin.findOne({ email: emailNorm, isDeleted: false });
  if (existingLegacy) {
    return res.status(409).json({
      status: "failed",
      message: "User with this email already exists",
    });
  }

  const displayName = (schoolName && String(schoolName).trim()) || name || "My School";

  // Create school database: name includes school name for readability (e.g. lms_central-high-school_a1b2c3d4)
  const schoolId = new mongoose.Types.ObjectId();
  const schoolDbName = buildSchoolDbName(displayName, schoolId.toString());
  try {
    await bootstrapSchoolDatabase(schoolDbName);
  } catch (err) {
    console.error("Failed to bootstrap school database:", err);
    return res.status(500).json({
      status: "failed",
      message: "Failed to create school. Please try again.",
    });
  }

  // Create Admin inside the school database
  const models = getTenantModels(schoolDbName);
  const user = await models.Admin.create({
    name,
    email: emailNorm,
    password: await hashPassword(password),
    schoolDbName,
    schoolName: displayName,
  });

  await AdminLogin.create({
    email: emailNorm,
    schoolDbName,
  });

  res.status(201).json({
    status: "success",
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      schoolName: user.schoolName,
      schoolDbName,
    },
  });
});

//@desc Login admin
//@route POST  api/v1/admins/login
//@acess Private

exports.loginAdminCtrl = AsyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const emailNorm = email?.toLowerCase?.()?.trim();

  const loginEntry = await AdminLogin.findOne({ email: emailNorm });
  let user;

  if (loginEntry) {
    const models = getTenantModels(loginEntry.schoolDbName);
    user = models?.Admin && await models.Admin.findOne({
      email: emailNorm,
      isDeleted: { $ne: true },
    });
  }
  if (!user) {
    user = await Admin.findOne({
      email: emailNorm,
      isDeleted: { $ne: true },
    });
  }

  if (!user) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  const isMatched = await isPasswordMatched(password, user.password);
  if (!isMatched) {
    return res.status(401).json({ message: "Invalid login credentials" });
  }

  const token = generateToken(user._id, {
    schoolDbName: user.schoolDbName || loginEntry?.schoolDbName || null,
  });
  return res.json({
    data: token,
    message: "Admin Logged in successfully",
  });
});

//@desc all admins
//@route GET  api/v1/admins
//@acess Private

exports.getAdminsCtrl = AsyncHandler(async (req, res) => {
  const AdminModel = req.tenantModels?.Admin || Admin;
  const admins = await AdminModel.find({ isDeleted: false })
    .select("-password -createdAt -updatedAt")
    .lean();
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
  const AdminModel = req.tenantModels?.Admin || Admin;
  const admin = await AdminModel.findOne({
    _id: req.userAuth._id,
    isDeleted: false,
  })
    .select("-password -createdAt -updatedAt")
    .lean();

  if (!admin) {
    return res.status(404).json({
      status: "failed",
      messageKey: "admin.not_found",
      message: "Admin not found",
    });
  }

  if (req.tenantModels) {
    const ids = (arr) => (arr || []).filter(Boolean);
    const [programs, yearGroups, classLevels, academicYears] = await Promise.all([
      ids(admin.programs).length
        ? req.tenantModels.Program.find({ _id: { $in: ids(admin.programs) }, isDeleted: { $ne: true } }).lean()
        : [],
      ids(admin.yearGroups).length
        ? req.tenantModels.YearGroup.find({ _id: { $in: ids(admin.yearGroups) } }).lean()
        : [],
      ids(admin.classLevels).length
        ? req.tenantModels.ClassLevel.find({ _id: { $in: ids(admin.classLevels) } }).lean()
        : [],
      ids(admin.academicYears).length
        ? req.tenantModels.AcademicYear.find({ _id: { $in: ids(admin.academicYears) } }).lean()
        : [],
    ]);
    admin.programs = programs;
    admin.yearGroups = yearGroups;
    admin.classLevels = classLevels;
    admin.academicYears = academicYears;
  } else {
    const populated = await AdminModel.findOne({ _id: admin._id })
      .select("-password -createdAt -updatedAt")
      .populate("academicYears", "name fromYear toYear")
      .populate({ path: "programs", match: { isDeleted: { $ne: true } }, select: "name code" })
      .populate("yearGroups", "name")
      .populate("classLevels", "name")
      .lean();
    admin.programs = populated?.programs || [];
    admin.yearGroups = populated?.yearGroups || [];
    admin.classLevels = populated?.classLevels || [];
    admin.academicYears = populated?.academicYears || [];
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
  const AdminModel = req.tenantModels?.Admin || Admin;

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const admin = await AdminModel.findOne({
      _id: req.userAuth._id,
      isDeleted: false,
    }).select("-password -createdAt -updatedAt");
    if (!admin) {
      return res.status(404).json({
        status: "failed",
        messageKey: "admin.not_found",
        message: "Admin not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Admin profile fetched successfully",
      data: admin,
    });
  }

  const { email, password, name, schoolName } = req.body;

  if (email) {
    const emailExist = await AdminModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id }, // Exclude current user
      isDeleted: false, // Ignore soft-deleted admins
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        messageKey: "admin.email_exists",
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
    if (schoolName !== undefined) updateData.schoolName = String(schoolName).trim() || undefined;

    const admin = await AdminModel.findOneAndUpdate(
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
        messageKey: "admin.not_found",
        message: "Admin not found",
      });
    }

    const token = req.headers?.authorization?.split(" ")[1];
    if (token) require("../utils/authCache").del(token);

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
    if (schoolName !== undefined) updateData.schoolName = String(schoolName).trim() || undefined;

    const admin = await AdminModel.findOneAndUpdate(
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
        messageKey: "admin.not_found",
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
      messageKey: "admin.not_found",
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
  const Teacher = getModel(req, "Teacher");
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      messageKey: "admin.teacher_id_required",
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
      messageKey: "admin.teacher_not_found",
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
  const Teacher = getModel(req, "Teacher");
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      messageKey: "admin.teacher_id_required",
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
      messageKey: "admin.teacher_not_found",
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
  const Teacher = getModel(req, "Teacher");
  const AdminModel = getModel(req, "Admin");
  const Program = getModel(req, "Program");
  const Module = getModel(req, "Module");
  const idParam = req.params.id?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      messageKey: "admin.teacher_id_required",
      message: "Teacher ID is required",
    });
  }
  const teacher = await Teacher.findOneAndDelete(findTeacherQuery(idParam));
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      messageKey: "admin.teacher_not_found",
      message: "Teacher not found",
    });
  }
  const teacherObjId = teacher._id;
  await AdminModel.updateMany({}, { $pull: { teachers: teacherObjId } });
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
    messageKey: "admin.cannot_unwithdraw_teacher",
    message:
      "Cannot unwithdraw. Withdrawn teachers are permanently deleted. Register a new teacher if needed.",
  });
});

//@desc withdraw student (permanently deletes from database)
//@route PUT  api/v1/admins/withdraw/students/:id
//@access Private admin only

exports.adminWithdrawStudentCtrl = AsyncHandler(async (req, res) => {
  const Student = getModel(req, "Student");
  const studentId = req.params.id;
  const student = await Student.findByIdAndDelete(studentId);
  if (!student) {
    return res.status(404).json({
      status: "failed",
      messageKey: "admin.student_not_found",
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
    messageKey: "admin.cannot_unwithdraw_student",
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
