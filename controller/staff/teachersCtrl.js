const AsyncHandler = require("express-async-handler");
const bcrypt = require("bcryptjs");
const Teacher = require("../../model/Staff/Teacher");
const Admin = require("../../model/Staff/Admin");
const Program = require("../../model/Academic/Program");
const Module = require("../../model/Academic/Module");
const Student = require("../../model/Academic/Student");
const TeacherLogin = require("../../model/Registry/TeacherLogin");
const { getTenantModels } = require("../../utils/tenantConnection");
const getModel = require("../../utils/getModel");

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
      messageKey: "teacher.body_required",
      message: "Request body is required",
    });
  }

  const { name, email, password } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      status: "failed",
      messageKey: "teacher.fields_required",
      message: "Name, email, and password are required fields",
    });
  }
  // find admin (tenant DB when admin has schoolDbName, else default)
  const AdminModel = req.tenantModels?.Admin || Admin;
  const adminFound = await AdminModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });
  if (!adminFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "admin.not_found",
      message: "Admin not found",
    });
  }

  const TeacherModel = req.tenantModels?.Teacher || Teacher;

  //check if the teacher already exists (registry for cross-tenant, or tenant/default)
  const loginExists = await TeacherLogin.findOne({ email: email.toLowerCase().trim() });
  if (loginExists) {
    return res.status(409).json({
      status: "failed",
      messageKey: "teacher.already_exists",
      message: "Teacher already exists",
    });
  }
  const teacherExists = await TeacherModel.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: { $ne: true },
  });
  if (teacherExists) {
    return res.status(409).json({
      status: "failed",
      messageKey: "teacher.already_exists",
      message: "Teacher already exists",
    });
  }

  const hashedPassword = await hashPassword(password);

  const teacherCreated = await TeacherModel.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
  });

  if (adminFound.schoolDbName) {
    await TeacherLogin.create({
      email: email.toLowerCase().trim(),
      schoolDbName: adminFound.schoolDbName,
      teacherId: teacherCreated._id,
    });
  }

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
  const emailNorm = email?.toLowerCase?.()?.trim();

  const loginEntry = await TeacherLogin.findOne({ email: emailNorm });
  let teacher;

  if (loginEntry) {
    const models = getTenantModels(loginEntry.schoolDbName);
    teacher = models?.Teacher && await models.Teacher.findOne({
      _id: loginEntry.teacherId,
      isDeleted: { $ne: true },
    });
  }
  if (!teacher) {
    teacher = await Teacher.findOne({
      email: emailNorm,
      isDeleted: { $ne: true },
    });
  }

  if (!teacher) {
    return res.status(401).json({
      status: "failed",
      messageKey: "auth.invalid_credentials",
      message: "Invalid email or password",
    });
  }

  const isMatched = await isPasswordMatched(password, teacher.password);
  if (!isMatched) {
    return res.status(401).json({
      status: "failed",
      messageKey: "auth.invalid_credentials",
      message: "Invalid email or password",
    });
  }

  const schoolDbName = loginEntry?.schoolDbName || null;
  const token = generateToken(teacher._id, schoolDbName ? { schoolDbName } : {});

  return res.status(200).json({
    status: "success",
    message: "Teacher logged in successfully",
    data: token,
  });
});

//@dec get all teachers
//@route GET /api/v1/teachers/
//@access Private admins only

exports.getTeachersCtrl = AsyncHandler(async (req, res) => {
  const TeacherModel = getModel(req, "Teacher");
  const filter = { isDeleted: { $ne: true } };
  if (req.query.name && typeof req.query.name === "string") {
    filter.name = { $regex: req.query.name, $options: "i" };
  }
  const TeacherQuery = TeacherModel.find(filter)
    .select("-password -createdAt -updatedAt")
    .populate("programs", "name code")
    .populate("modules", "name description")
    .populate("yearGroups", "name")
    .lean();
  //convert query strings to numbers
  const page = Number(req.query.page) || 1;
  const limit = Number(req.query.limit) || 10;
  const skip = (page - 1) * limit;
  //get total number of teachers
  const totalTeachers = await TeacherModel.countDocuments({
    isDeleted: { $ne: true },
  });

  const startIndex = (page - 1) * limit;
  const endIndex = page * limit;

  // pagination results
  const pagination = {};

  if (endIndex < totalTeachers) {
    pagination.next = {
      page: page + 1,
      limit: limit,
    };
  }
  if (startIndex > 0) {
    pagination.previous = {
      page: page - 1,
      limit: limit,
    };
  }
  const teachers = await TeacherQuery.skip(skip).limit(limit).lean();

  res.status(200).json({
    totalTeachers,
    pagination,
    status: "success",
    data: teachers,
    results: teachers.length,
    message: "All teachers fetched successfully",
  });
});

//@dec get single teacher
//@route GET /api/v1/teachers/:teacherId/admin
//@access Private admins only

exports.getSingleTeacherCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.params.teacherId;
  const TeacherModel = getModel(req, "Teacher");
  const teacher = await TeacherModel.findOne({
    _id: teacherId,
    isDeleted: { $ne: true },
  })
    .select("-password -createdAt -updatedAt")
    .populate("programs", "name code")
    .populate("modules", "name description")
    .populate("yearGroups", "name")
    .lean();
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      messageKey: "teacher.not_found",
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
  const TeacherModel = getModel(req, "Teacher");
  const teacher = await TeacherModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  })
    .select("-password -createdAt -updatedAt")
    .populate("programs", "name code")
    .populate("modules", "name description")
    .populate("yearGroups", "name")
    .lean();
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      messageKey: "teacher.not_found",
      message: "Teacher not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: teacher,
    message: "Teacher profile fetched successfully",
  });
});

//@desc get students in teacher's year groups
//@route GET /api/v1/teachers/students
//@access Private teachers only
//@query yearGroup (optional) - filter to single year group (must be in teacher's yearGroups)

exports.getTeacherStudentsCtrl = AsyncHandler(async (req, res) => {
  const TeacherModel = getModel(req, "Teacher");
  const StudentModel = getModel(req, "Student");
  const teacher = await TeacherModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  })
    .select("yearGroups")
    .populate("yearGroups", "name");

  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      messageKey: "teacher.not_found",
      message: "Teacher not found",
    });
  }

  const teacherYearGroupIds = (teacher.yearGroups || [])
    .map((g) => (typeof g === "object" ? g?._id : g))
    .filter(Boolean);

  let allowedYearGroupIds = teacherYearGroupIds;

  const yearGroupFilter = req.query.yearGroup;
  if (yearGroupFilter) {
    const filterId = yearGroupFilter.toString();
    if (!teacherYearGroupIds.some((id) => id.toString() === filterId)) {
      return res.status(403).json({
        status: "failed",
        messageKey: "teacher.year_groups_only",
        message: "You can only view students in your assigned year groups",
      });
    }
    allowedYearGroupIds = [filterId];
  }

  if (allowedYearGroupIds.length === 0) {
    return res.status(200).json({
      status: "success",
      data: [],
      message: "No year groups assigned. Students will appear when you are assigned to year groups.",
    });
  }

  const students = await StudentModel.find({
    yearGroup: { $in: allowedYearGroupIds },
    isWithdrawn: { $ne: true },
  })
    .select("name studentId yearGroup email")
    .populate("yearGroup", "name")
    .sort({ name: 1 });

  const grouped = allowedYearGroupIds.map((ygId) => {
    const idStr = ygId.toString();
    const ygName =
      (teacher.yearGroups || []).find(
        (g) => (g?._id || g)?.toString() === idStr
      )?.name || idStr;
    const groupStudents = students
      .filter((s) => (s.yearGroup?._id || s.yearGroup)?.toString() === idStr)
      .map((s) => ({
        _id: s._id,
        name: s.name,
        studentId: s.studentId,
        email: s.email,
        yearGroup: s.yearGroup?._id || s.yearGroup,
        yearGroupName: s.yearGroup?.name,
      }));
    return {
      yearGroup: idStr,
      yearGroupName: ygName,
      students: groupStudents,
    };
  });

  res.status(200).json({
    status: "success",
    data: grouped,
    message: "Students fetched successfully",
  });
});

//@dec update teacher profile
//@route PUT /api/v1/teachers/:teacherId/update
//@access Private teachers only

exports.updateTeacherProfileCtrl = AsyncHandler(async (req, res) => {
  const TeacherModel = getModel(req, "Teacher");

  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const teacher = await TeacherModel.findOne({
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

  if (email) {
    const emailExist = await TeacherModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id },
      isDeleted: { $ne: true },
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        messageKey: "teacher.email_exists",
        message: "Email already exists",
      });
    }
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const updateData = { password: hashedPassword };
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    const teacher = await TeacherModel.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      { new: true, runValidators: true },
    );

    if (!teacher) {
      return res.status(404).json({
        status: "failed",
        message: "Teacher not found",
      });
    }

    const token = req.headers?.authorization?.split(" ")[1];
    if (token) require("../utils/authCache").del(token);

    return res.status(200).json({
      status: "success",
      message: "Teacher updated successfully",
      data: teacher,
    });
  } else {
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    const teacher = await TeacherModel.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      { new: true, runValidators: true },
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
  const TeacherModel = getModel(req, "Teacher");
  const ProgramModel = getModel(req, "Program");
  const ModuleModel = getModel(req, "Module");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "teacher.body_required",
      message: "Request body is required",
    });
  }

  const {
    program,
    programs,
    modules,
    classLevel,
    academicYear,
    yearGroup,
    yearGroups,
    subject,
    name,
    email,
    password,
  } = req.body;
  const teacherId = req.params.teacherId;

  const teacherFound = await TeacherModel.findOne({
    _id: teacherId,
    isDeleted: { $ne: true },
  });

  if (!teacherFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "teacher.not_found",
      message: "Teacher not found",
    });
  }

  // Check if teacher is withdrawn
  if (teacherFound.isWithdrawn) {
    return res.status(403).json({
      status: "failed",
      messageKey: "teacher.withdrawn",
      message: "Action denied, teacher is withdrawn",
    });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (program !== undefined) updateData.program = program;
  if (programs !== undefined && Array.isArray(programs)) {
    updateData.programs = programs.filter((p) => p);
  }
  if (modules !== undefined && Array.isArray(modules)) {
    updateData.modules = modules.filter((m) => m);
  }
  if (classLevel !== undefined) updateData.classLevel = classLevel;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (yearGroup !== undefined) updateData.yearGroup = yearGroup;
  if (yearGroups !== undefined && Array.isArray(yearGroups)) {
    updateData.yearGroups = yearGroups.filter((g) => g);
  }
  if (subject !== undefined) updateData.subject = subject;
  if (name !== undefined) updateData.name = name;
  if (password !== undefined) {
    if (typeof password !== "string" || password.trim().length < 6) {
      return res.status(400).json({
        status: "failed",
        messageKey: "teacher.password_min",
        message: "Password must be at least 6 characters",
      });
    }
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password.trim(), salt);
  }
  if (email !== undefined) {
    const emailExist = await TeacherModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: teacherId },
      isDeleted: { $ne: true },
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        messageKey: "teacher.email_exists",
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

  const updatedTeacher = await TeacherModel.findByIdAndUpdate(
    teacherId,
    updateData,
    { new: true, runValidators: true },
  );

  if (programs !== undefined || modules !== undefined) {
    const finalPrograms = updatedTeacher.programs || [];
    const finalModules = updatedTeacher.modules || [];
    const teacherObjId = updatedTeacher._id;

    if (programs !== undefined) {
      const prevProgramIds = (teacherFound.programs || []).map((p) => p.toString());
      const newProgramIds = finalPrograms.map((p) => p.toString());
      const toRemove = prevProgramIds.filter((id) => !newProgramIds.includes(id));
      const toAdd = newProgramIds.filter((id) => !prevProgramIds.includes(id));
      if (toRemove.length) {
        await ProgramModel.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { teachers: teacherObjId } },
        );
      }
      if (toAdd.length) {
        await ProgramModel.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { teachers: teacherObjId } },
        );
      }
    }

    if (modules !== undefined) {
      const prevModuleIds = (teacherFound.modules || []).map((m) => m.toString());
      const newModuleIds = finalModules.map((m) => m.toString());
      const toRemove = prevModuleIds.filter((id) => !newModuleIds.includes(id));
      const toAdd = newModuleIds.filter((id) => !prevModuleIds.includes(id));
      if (toRemove.length) {
        await ModuleModel.updateMany(
          { _id: { $in: toRemove } },
          { $pull: { teachers: teacherObjId } },
        );
      }
      if (toAdd.length) {
        await ModuleModel.updateMany(
          { _id: { $in: toAdd } },
          { $addToSet: { teachers: teacherObjId } },
        );
      }
    }
  }

  const teacherWithPopulated = await TeacherModel.findById(teacherId)
    .populate("programs", "name code")
    .populate("modules", "name description")
    .populate("yearGroups", "name");

  res.status(200).json({
    status: "success",
    data: teacherWithPopulated,
    message: "Teacher updated successfully",
  });
});

//@desc Withdraw (permanently delete) teacher
//@route DELETE /api/v1/teachers/:teacherId
//@access Private admin only

const findTeacherQuery = (idParam) => {
  const isObjectId = /^[a-fA-F0-9]{24}$/.test(idParam);
  return isObjectId ? { _id: idParam } : { teacherId: idParam };
};

exports.withdrawTeacherCtrl = AsyncHandler(async (req, res) => {
  const TeacherModel = getModel(req, "Teacher");
  const AdminModel = getModel(req, "Admin");
  const ProgramModel = getModel(req, "Program");
  const ModuleModel = getModel(req, "Module");
  const idParam = req.params.teacherId?.trim();
  if (!idParam) {
    return res.status(400).json({
      status: "failed",
      messageKey: "teacher.teacher_id_required",
      message: "Teacher ID is required",
    });
  }
  const teacher = await TeacherModel.findOneAndDelete(findTeacherQuery(idParam));
  if (!teacher) {
    return res.status(404).json({
      status: "failed",
      messageKey: "teacher.not_found",
      message: "Teacher not found",
    });
  }
  const teacherObjId = teacher._id;
  await AdminModel.updateMany({}, { $pull: { teachers: teacherObjId } });
  await ProgramModel.updateMany({}, { $pull: { teachers: teacherObjId } });
  await ModuleModel.updateMany({}, { $pull: { teachers: teacherObjId } });

  res.status(200).json({
    status: "success",
    message: "Teacher withdrawn and permanently deleted from database",
    data: { id: teacherObjId.toString() },
  });
});
