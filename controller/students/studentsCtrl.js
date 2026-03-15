const AsyncHandler = require("express-async-handler");
const Student = require("../../model/Academic/Student");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");
const Admin = require("../../model/Staff/Admin");
const StudentLogin = require("../../model/Registry/StudentLogin");
const { getTenantModels } = require("../../utils/tenantConnection");
const getModel = require("../../utils/getModel");

//@desc Register student
//@route POST /api/v1/students/admin/register
//@access Private admin only

exports.adminRegisterStudentCtrl = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "student.body_required",
      message: "Request body is required",
    });
  }

  const { name, email, password, program, yearGroup, academicYear, modules } =
    req.body;

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

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student.fields_required",
      message: "Name, email, and password are required fields",
    });
  }

  //check if the student already exists
  const StudentModel = req.tenantModels?.Student || Student;
  const student = await StudentModel.findOne({
    email: email.toLowerCase().trim(),
    isDeleted: { $ne: true }, // Ignore soft-deleted students
  });
  if (student) {
    return res.status(409).json({
      status: "failed",
      messageKey: "student.already_exists",
      message: "Student already exists",
    });
  }

  //hash password
  const hashedPassword = await hashPassword(password);

  const modulesArray =
    Array.isArray(modules) && modules.length > 0 ? modules.filter((m) => m) : [];

  const studentCreated = await StudentModel.create({
    name,
    email: email.toLowerCase().trim(),
    password: hashedPassword,
    ...(program && { program }),
    ...(yearGroup && { yearGroup }),
    ...(academicYear && { academicYear }),
    ...(modulesArray.length > 0 && { modules: modulesArray }),
  });

  adminFound.students.push(studentCreated._id);
  await adminFound.save();

  if (adminFound.schoolDbName) {
    await StudentLogin.create({
      email: email.toLowerCase().trim(),
      studentId: studentCreated.studentId,
      schoolDbName: adminFound.schoolDbName,
      studentObjectId: studentCreated._id,
    });
  }

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
  const emailNorm = email?.toLowerCase?.()?.trim();

  const loginEntry = await StudentLogin.findOne({ email: emailNorm });
  let student;

  if (loginEntry) {
    const models = getTenantModels(loginEntry.schoolDbName);
    student = models?.Student && await models.Student.findOne({
      _id: loginEntry.studentObjectId,
      isDeleted: { $ne: true },
    });
  }
  if (!student) {
    student = await Student.findOne({
      email: emailNorm,
      isDeleted: { $ne: true },
    });
  }

  if (!student) {
    return res.status(401).json({
      status: "failed",
      messageKey: "auth.invalid_credentials",
      message: "Invalid email or password",
    });
  }

  const isMatched = await isPasswordMatched(password, student.password);
  if (!isMatched) {
    return res.status(401).json({
      status: "failed",
      messageKey: "auth.invalid_credentials",
      message: "Invalid email or password",
    });
  }

  const schoolDbName = loginEntry?.schoolDbName || null;
  const token = generateToken(student._id, schoolDbName ? { schoolDbName } : {});
  return res.status(200).json({
    status: "success",
    message: "Student logged in successfully",
    data: token,
  });
});

//@dec student profile
//@route GET /api/v1/students/profile
//@access Private students only

exports.getStudentProfileCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const student = await StudentModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  })
    .select("-password -createdAt -updatedAt")
    .populate("examResults")
    .populate("program")
    .populate("modules", "name description")
    .populate("yearGroup");
  if (!student) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }
  // get student profie

  const studentProfile = {
    name: student?.name,
    email: student?.email,
    studentId: student?.studentId,
    program: student?.program,
    modules: student?.modules,
    yearGroup: student?.yearGroup,
    dateAdmitted: student?.dateAdmitted,
    isWithdrawn: student?.isWithdrawn,
    isSuspended: student?.isSuspended,
    prefectName: student?.prefectName,
  };

  const examResults = student?.examResults || [];
  const currentExamResult =
    examResults.length > 0 ? examResults[examResults.length - 1] : null;

  // Only include currentExamResult if published; always return profile
  const isPublished = currentExamResult?.isPublished;
  const currentExamResultData = isPublished ? currentExamResult : null;

  res.status(200).json({
    status: "success",
    data: {
      studentProfile,
      currentExamResult: currentExamResultData,
    },
    message: "Student profile fetched successfully",
  });
});

//@dec get all students
//@route GET /api/v1/students/
//@access Private admins only

exports.getStudentsCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = req.tenantModels?.Student || Student;
  const students = await StudentModel.find({
    isDeleted: { $ne: true },
  })
    .populate("program", "name code")
    .populate("modules", "name description")
    .populate("yearGroup");
  res.status(200).json({
    status: "success",
    data: students,
    message: "All students fetched successfully",
  });
});

//@dec get student graduation status
//@route GET /api/v1/students/:studentId/graduation-status
//@access Private (admin or student viewing own)

exports.getGraduationStatusCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const ExamResult = getModel(req, "ExamResult");
  const Module = getModel(req, "Module");
  const studentId = req.params.studentId;
  const userIsAdmin = req.userAuth?.role === "admin";
  const isOwnProfile =
    req.userAuth?._id?.toString() === studentId ||
    req.userAuth?.id === studentId;

  if (!userIsAdmin && !isOwnProfile) {
    return res.status(403).json({
      status: "failed",
      messageKey: "student.graduation_own_only",
      message: "You can only view your own graduation status",
    });
  }

  const student = await StudentModel.findById(studentId)
    .select("program isGraduated yearGraduated")
    .populate("program", "name modules");

  if (!student) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  if (!student.program) {
    return res.status(200).json({
      status: "success",
      data: {
        isGraduated: student.isGraduated || false,
        eligible: false,
        yearGraduated: student.yearGraduated,
        modulesPassed: [],
        modulesPending: [],
        message: "Student has no program assigned",
      },
    });
  }

  const moduleIds = student.program.modules || [];
  if (moduleIds.length === 0) {
    return res.status(200).json({
      status: "success",
      data: {
        isGraduated: student.isGraduated || false,
        eligible: false,
        yearGraduated: student.yearGraduated,
        modulesPassed: [],
        modulesPending: [],
        message: "Program has no modules defined",
      },
    });
  }

  const passedResults = await ExamResult.find({
    student: studentId,
    status: "Passed",
    isPublished: true,
  })
    .populate("exam", "module name")
    .lean();

  const passedModuleIds = new Set();
  for (const er of passedResults) {
    const mid = er.exam?.module?.toString?.() || er.exam?.module;
    if (mid) passedModuleIds.add(mid);
  }

  const modulesInfo = await Module.find({
    _id: { $in: moduleIds },
    isDeleted: { $ne: true },
  })
    .select("name _id")
    .lean();

  const modulesPassed = modulesInfo.filter((m) =>
    passedModuleIds.has(m._id.toString()),
  );
  const modulesPending = modulesInfo.filter(
    (m) => !passedModuleIds.has(m._id.toString()),
  );

  const eligible = modulesPending.length === 0;

  res.status(200).json({
    status: "success",
    data: {
      isGraduated: student.isGraduated || false,
      eligible,
      yearGraduated: student.yearGraduated,
      modulesPassed: modulesPassed.map((m) => ({ _id: m._id, name: m.name })),
      modulesPending: modulesPending.map((m) => ({ _id: m._id, name: m.name })),
    },
  });
});

//@dec get single student
//@route GET /api/v1/students/:studentId/admin
//@access Private admins only

exports.getSingleStudentCtrl = AsyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const StudentModel = req.tenantModels?.Student || Student;
  const student = await StudentModel.findOne({
    _id: studentId,
    isDeleted: { $ne: true },
  })
    .populate("program", "name code")
    .populate("modules", "name description")
    .populate("yearGroup");
  if (!student) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }
  res.status(200).json({
    status: "success",
    data: student,
    message: "Student fetched successfully",
  });
});

//@dec update student profile
//@route PUT /api/v1/students/profile (self-update) or PUT /api/v1/students/:studentId (admin update)
//@access Private students only (for profile) or Private admin only (for :studentId)

exports.updateStudentProfileCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const student = await StudentModel.findOne({
      _id: req.userAuth._id,
      isDeleted: { $ne: true },
    }).select("-password -createdAt -updatedAt");
    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }
    return res.status(200).json({
      status: "success",
      message: "Student profile fetched successfully",
      data: student,
    });
  }

  const { email, password, name } = req.body;

  if (email) {
    const emailExist = await StudentModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id },
      isDeleted: { $ne: true },
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        messageKey: "student.email_exists",
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

    const student = await StudentModel.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    const token = req.headers?.authorization?.split(" ")[1];
    if (token) require("../utils/authCache").del(token);

    return res.status(200).json({
      status: "success",
      message: "Student updated successfully",
      data: student,
    });
  } else {
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    const student = await StudentModel.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      { new: true, runValidators: true },
    );

    if (!student) {
      return res.status(404).json({
        status: "failed",
        message: "Student not found",
      });
    }

    return res.status(200).json({
      status: "success",
      message: "Student updated successfully",
      data: student,
    });
  }
});

//@des admin update student profile
//@route PUT /api/v1/students/:studentId/admin
//@access Private admins only

exports.adminUpdateStudent = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "student.body_required",
      message: "Request body is required",
    });
  }

  const studentId = req.params.studentId;
  const StudentModel = req.tenantModels?.Student || Student;

  // Find student (ignore soft-deleted)
  const studentFound = await StudentModel.findOne({
    _id: studentId,
    isDeleted: { $ne: true },
  });

  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  // If body is empty or has no fields, return current student data
  if (Object.keys(req.body).length === 0) {
    return res.status(200).json({
      status: "success",
      message: "Student profile fetched successfully",
      data: studentFound,
    });
  }

  const {
    program,
    modules,
    academicYear,
    yearGroup,
    name,
    email,
    password,
    isWithdrawn,
    isSuspended,
    isGraduated,
    dateAdmitted,
    yearGraduated,
    prefectName,
  } = req.body;

  // Check if student is withdrawn (only block if not explicitly un-withdrawing)
  if (studentFound.isWithdrawn && isWithdrawn !== false) {
    return res.status(403).json({
      status: "failed",
      messageKey: "student.withdrawn",
      message: "Action denied, student is withdrawn",
    });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (program !== undefined) updateData.program = program;
  if (modules !== undefined && Array.isArray(modules)) {
    updateData.modules = modules.filter((m) => m);
  }
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (yearGroup !== undefined) updateData.yearGroup = yearGroup;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    // Check if email already exists (if email is being updated)
    const emailExist = await StudentModel.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: studentId },
      isDeleted: { $ne: true },
    });
    if (emailExist) {
      return res.status(409).json({
        status: "failed",
        messageKey: "student.email_exists",
        message: "Email already exists",
      });
    }
    updateData.email = email.toLowerCase().trim();
  }
  if (password !== undefined) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }
  if (isWithdrawn !== undefined) updateData.isWithdrawn = isWithdrawn;
  if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
  if (isGraduated !== undefined) updateData.isGraduated = isGraduated;
  if (dateAdmitted !== undefined) updateData.dateAdmitted = dateAdmitted;
  if (yearGraduated !== undefined) updateData.yearGraduated = yearGraduated;
  if (prefectName !== undefined) updateData.prefectName = prefectName;

  // If no fields to update, return current student data
  if (Object.keys(updateData).length === 0) {
    return res.status(200).json({
      status: "success",
      message: "No fields to update",
      data: studentFound,
    });
  }

  await StudentModel.findByIdAndUpdate(studentId, updateData, {
    new: true,
    runValidators: true,
  });

  const updatedStudent = await StudentModel.findById(studentId)
    .populate("program", "name code")
    .populate("modules", "name description")
    .populate("yearGroup");

  res.status(200).json({
    status: "success",
    data: updatedStudent,
    message: "Student updated successfully",
  });
});

//@dec student list available exams
//@route GET /api/v1/students/exams
//@access Private students only

exports.getStudentExamsCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const Exam = getModel(req, "Exam");
  const studentFound = await StudentModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  }).select("academicYear yearGroup");
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  const filter = { isDeleted: { $ne: true } };
  if (studentFound.yearGroup) {
    filter.yearGroup = studentFound.yearGroup;
  }
  if (studentFound.academicYear) {
    filter.academicYear = studentFound.academicYear;
  }

  const exams = await Exam.find(filter)
    .populate("questions")
    .populate("subject")
    .populate("classLevel")
    .populate("yearGroup")
    .populate("academicYear")
    // .populate("academicTerm") // Vocational: academic terms not used
    .sort({ examDate: -1 });

  res.status(200).json({
    status: "success",
    message: "Exams fetched successfully",
    data: exams,
  });
});

//@dec student get single exam (for taking)
//@route GET /api/v1/students/exams/:examId
//@access Private students only

exports.getStudentExamCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const Exam = getModel(req, "Exam");
  const ExamResult = getModel(req, "ExamResult");
  const studentFound = await StudentModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  const exam = await Exam.findById(req.params.examId)
    .populate("questions")
    .populate("subject")
    .populate("classLevel")
    .populate("yearGroup")
    .populate("academicYear");
    // .populate("academicTerm"); // Vocational: academic terms not used
  if (!exam || exam.isDeleted) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.not_found",
      message: "Exam not found",
    });
  }

  // Check if already taken
  const alreadyTaken = await ExamResult.findOne({
    studentId: studentFound.studentId,
    exam: exam._id,
  });
  if (alreadyTaken) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.already_taken",
      message: "You have already taken this exam",
    });
  }

  if (studentFound.isSuspended || studentFound.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.suspended",
      message: "You are suspended or withdrawn",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Exam fetched successfully",
    data: exam,
  });
});

//@dec student write exam
//@route POST /api/v1/students/exams/:examId
//@access Private students only

exports.studentWriteExamCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const Exam = getModel(req, "Exam");
  const ExamResult = getModel(req, "ExamResult");
  const studentFound = await StudentModel.findById(req.userAuth?._id);
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found_or_deleted",
      message: "Student not found or deleted",
    });
  }

  // get exam
  const examFound = await Exam.findById(req.params.examId)
    .populate("questions");
    // .populate("academicTerm"); // Vocational: academic terms not used
  if (!examFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.not_found",
      message: "Exam not found",
    });
  }

  if (examFound.examType === "project-submission") {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.project_submission_required",
      message:
        "This is a project-submission exam. Please use the upload form to submit your ZIP file.",
    });
  }

  //get quetions
  const questions = examFound?.questions;
  if (!questions) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student_exam.questions_not_found",
      message: "Questions not found",
    });
  }

  //get student answers
  const studentAnswers = req.body.answers;
  if (!studentAnswers) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student_exam.answers_not_found",
      message: "Student answers not found",
    });
  }

  // check if student asnwered all questions
  if (studentAnswers.length !== questions.length) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.answer_all",
      message: "Please answer all questions",
    });
  }

  // check if student has already taken the exam
  const studentFoundInResults = await ExamResult.findOne({
    studentId: studentFound?.studentId,
    exam: examFound?._id,
  });
  if (studentFoundInResults) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.already_taken",
      message: "You have already taken this exam",
    });
  }

  // check is student is suspended

  if (studentFound?.isSuspended || studentFound?.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.suspended",
      message: "You are suspended or withdrawn",
    });
  }

  // Build result object
  const { gradeAnswer } = require("../../utils/questionTypeUtils");
  const passMark = examFound.passMark ?? 50;
  const totalMark = questions.reduce((sum, q) => sum + (q.mark || 1), 0);
  let score = 0;
  const answeredQuestions = [];
  let hasManualGrading = false;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const rawAnswer = studentAnswers[i];
    const qType = question.questionType || "multiple-choice";
    const qMark = question.mark || 1;

    // Normalize answer for storage
    const studentAnswerStr =
      typeof rawAnswer === "string"
        ? rawAnswer
        : Array.isArray(rawAnswer) || (rawAnswer && typeof rawAnswer === "object")
          ? JSON.stringify(rawAnswer)
          : String(rawAnswer ?? "");
    const studentAnswerPayload =
      typeof rawAnswer === "string" ? undefined : rawAnswer;

    if (qType === "multiple-choice") {
      const isCorrect =
        String(question.correctAnswer).toUpperCase() ===
        String(rawAnswer ?? "").toUpperCase();
      if (isCorrect) score += qMark;
      answeredQuestions.push({
        question: question.question,
        questionId: question._id,
        correctAnswer: question.correctAnswer,
        studentAnswer: studentAnswerStr,
        studentAnswerPayload,
        isCorrect,
        questionType: "multiple-choice",
        mark: qMark,
        pointsAwarded: isCorrect ? qMark : 0,
        needsManualGrading: false,
      });
    } else if (
      qType === "gap-fill" ||
      qType === "correct-mistake" ||
      qType === "matching" ||
      qType === "sentence-ordering"
    ) {
      const graded = gradeAnswer(question, rawAnswer);
      const pts = graded ? graded.pointsAwarded : 0;
      const correct = graded ? graded.isCorrect : false;
      if (correct) score += pts;
      answeredQuestions.push({
        question: question.question,
        questionId: question._id,
        correctAnswer: JSON.stringify(
          qType === "gap-fill"
            ? question.gapFillPayload?.correctAnswers
            : qType === "correct-mistake"
              ? question.correctMistakePayload?.correctAnswers
              : qType === "matching"
                ? question.matchingPayload?.correctPairs
                : question.sentenceOrderingPayload?.correctOrder,
        ),
        studentAnswer: studentAnswerStr,
        studentAnswerPayload,
        isCorrect: correct,
        questionType: qType,
        mark: qMark,
        pointsAwarded: pts,
        needsManualGrading: false,
      });
    } else {
      hasManualGrading = true;
      answeredQuestions.push({
        question: question.question,
        questionId: question._id,
        correctAnswer: question.correctAnswer || "",
        studentAnswer: studentAnswerStr,
        studentAnswerPayload,
        isCorrect: null,
        questionType: qType,
        mark: qMark,
        pointsAwarded: 0,
        needsManualGrading: true,
      });
    }
  }

  const grade = totalMark > 0 ? (score / totalMark) * 100 : 0;
  let status = "Pending";
  if (!hasManualGrading) {
    status = grade >= passMark ? "Passed" : "Failed";
  }

  let remarks = "Poor";
  if (status === "Passed" || grade >= 50) {
    if (grade >= 80) remarks = "Excellent";
    else if (grade >= 70) remarks = "Very Good";
    else if (grade >= 60) remarks = "Good";
    else remarks = "Average";
  }

  const examResult = await ExamResult.create({
    studentId: studentFound?.studentId,
    student: studentFound?._id,
    exam: examFound?._id,
    score,
    grade,
    passMark,
    totalMark,
    answeredQuestions,
    status,
    remarks,
    classLevel: examFound?.classLevel,
    yearGroup: examFound?.yearGroup,
    academicYear: examFound?.academicYear,
    // academicTerm: examFound?.academicTerm, // Vocational: academic terms not used
    isPublished: false,
    isFullyGraded: !hasManualGrading,
  });

  //push the exam result
  studentFound.examResults.push(examResult._id);
  await studentFound.save();

  // Vocational: no class-level promotion. Graduation is manual or defined separately.

  res.status(200).json({
    status: "success",
    data: "you have submitted your exam successfully, you can now view your result in the result section",
  });
});

//@desc Student submit project (ZIP) for project-submission exam
//@route POST /api/v1/students/exams/:examId/submit-project
//@access Private students only (multipart/form-data, field: file)

exports.submitProjectCtrl = AsyncHandler(async (req, res) => {
  const StudentModel = getModel(req, "Student");
  const Exam = getModel(req, "Exam");
  const ExamResult = getModel(req, "ExamResult");
  const examId = req.params.examId;

  const studentFound = await StudentModel.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  if (studentFound.isSuspended || studentFound.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.suspended",
      message: "You are suspended or withdrawn",
    });
  }

  const examFound = await Exam.findById(examId)
    // .populate("academicTerm") // Vocational: academic terms not used
    .populate("academicYear");
  if (!examFound || examFound.isDeleted) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.not_found",
      message: "Exam not found",
    });
  }

  if (examFound.examType !== "project-submission") {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.project_submission_required",
      message: "This exam is not a project-submission type",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.no_file_uploaded",
      message:
        "No file uploaded. Send as multipart/form-data with field name 'file', 'project', or 'zipFile'. Use FormData and append the file.",
    });
  }

  const alreadySubmitted = await ExamResult.findOne({
    studentId: studentFound.studentId,
    exam: examFound._id,
  });
  if (alreadySubmitted) {
    return res.status(400).json({
      status: "failed",
      messageKey: "student_exam.already_submitted_project",
      message: "You have already submitted a project for this exam",
    });
  }

  const passMark = examFound.passMark ?? 50;
  const totalMark = examFound.totalMark ?? 100;

  const examResult = await ExamResult.create({
    studentId: studentFound.studentId,
    student: studentFound._id,
    exam: examFound._id,
    score: 0,
    grade: 0,
    passMark,
    totalMark,
    answeredQuestions: [],
    status: "Pending",
    remarks: "Poor",
    classLevel: examFound.classLevel,
    yearGroup: examFound.yearGroup,
    academicYear: examFound.academicYear,
    // academicTerm: examFound.academicTerm, // Vocational: academic terms not used
    isPublished: false,
    isFullyGraded: false,
    submittedFile: {
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype || "application/zip",
      size: req.file.size,
      uploadedAt: new Date(),
    },
  });

  studentFound.examResults.push(examResult._id);
  await studentFound.save();

  res.status(201).json({
    status: "success",
    message: "Project submitted successfully. Wait for your teacher to grade it.",
    data: { examResultId: examResult._id },
  });
});
