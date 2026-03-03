const AsyncHandler = require("express-async-handler");
const Student = require("../../model/Academic/Student");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");
const Exam = require("../../model/Academic/Exam");
const ExamResult = require("../../model/Academic/ExamResults");
const Admin = require("../../model/Staff/Admin");

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

  const { name, email, password, program, yearGroup, academicYear } = req.body;

  // find admin
  const adminFound = await Admin.findById(req.userAuth._id);
  if (!adminFound) {
    return res.status(404).json({
      status: "failed",
      message: "Admin not found",
    });
  }

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
    ...(program && { program }),
    ...(yearGroup && { yearGroup }),
    ...(academicYear && { academicYear }),
  });

  // push to the admin
  adminFound.students.push(studentCreated._id);
  await adminFound.save();

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

//@dec student profile
//@route GET /api/v1/students/profile
//@access Private students only

exports.getStudentProfileCtrl = AsyncHandler(async (req, res) => {
  const student = await Student.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  })
    .select("-password -createdAt -updatedAt")
    .populate("examResults")
    .populate("program")
    .populate("currentClassLevel")
    .populate("yearGroup");
  if (!student) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }
  // get student profie

  const studentProfile = {
    name: student?.name,
    email: student?.email,
    studentId: student?.studentId,
    program: student?.program,
    currentClassLevel: student?.currentClassLevel,
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
  // Only fetch non-deleted students (handle documents without isDeleted field)
  const students = await Student.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  res.status(200).json({
    status: "success",
    data: students,
    message: "All students fetched successfully",
  });
});

//@dec get single student
//@route GET /api/v1/students/:studentId/admin
//@access Private admins only

exports.getSingleStudentCtrl = AsyncHandler(async (req, res) => {
  const studentId = req.params.studentId;
  const student = await Student.findOne({
    _id: studentId,
    isDeleted: { $ne: true },
  });
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
  // Route is PUT /profile (no params) - student updates own profile via req.userAuth
  // If body is empty or has no fields, return current user data
  if (
    !req.body ||
    typeof req.body !== "object" ||
    Object.keys(req.body).length === 0
  ) {
    const student = await Student.findOne({
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

  // Check if email already exists (only if email is being updated, ignore soft-deleted records)
  if (email) {
    const emailExist = await Student.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: req.userAuth._id }, // Exclude current user
      isDeleted: { $ne: true }, // Ignore soft-deleted students
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

    // Update student with password
    const student = await Student.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      },
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
  } else {
    // Build update object with only provided fields (no password)
    const updateData = {};
    if (email) updateData.email = email.toLowerCase().trim();
    if (name) updateData.name = name;

    // Update student without password
    const student = await Student.findOneAndUpdate(
      { _id: req.userAuth._id, isDeleted: { $ne: true } },
      updateData,
      {
        new: true,
        runValidators: true,
      },
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
      message: "Request body is required",
    });
  }

  const studentId = req.params.studentId;

  // Find student (ignore soft-deleted)
  const studentFound = await Student.findOne({
    _id: studentId,
    isDeleted: { $ne: true },
  });

  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
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
    classLevels,
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
    currentClassLevel,
  } = req.body;

  // Check if student is withdrawn (only block if not explicitly un-withdrawing)
  if (studentFound.isWithdrawn && isWithdrawn !== false) {
    return res.status(403).json({
      status: "failed",
      message: "Action denied, student is withdrawn",
    });
  }

  // Build update object with only provided fields
  const updateData = {};
  if (program !== undefined) updateData.program = program;
  if (classLevels !== undefined) updateData.classLevels = classLevels;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (yearGroup !== undefined) updateData.yearGroup = yearGroup;
  if (name !== undefined) updateData.name = name;
  if (email !== undefined) {
    // Check if email already exists (if email is being updated)
    const emailExist = await Student.findOne({
      email: email.toLowerCase().trim(),
      _id: { $ne: studentId },
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
  if (password !== undefined) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }
  if (isWithdrawn !== undefined) updateData.isWithdrawn = isWithdrawn;
  if (isSuspended !== undefined) updateData.isSuspended = isSuspended;
  if (isGraduated !== undefined) updateData.isGraduated = isGraduated;
  if (currentClassLevel !== undefined)
    updateData.currentClassLevel = currentClassLevel;
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

  // Update student with all fields at once
  const updatedStudent = await Student.findByIdAndUpdate(
    studentId,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

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
  const studentFound = await Student.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  }).select("currentClassLevel academicYear yearGroup");
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }

  const filter = { isDeleted: { $ne: true } };
  // Vocational: filter by yearGroup; fallback to classLevel
  if (studentFound.yearGroup) {
    filter.yearGroup = studentFound.yearGroup;
  } else if (studentFound.currentClassLevel) {
    filter.classLevel = studentFound.currentClassLevel;
  }
  if (studentFound.academicYear) {
    filter.academicYear = studentFound.academicYear;
  }

  const exams = await Exam.find(filter)
    .populate("questions")
    .populate("subject")
    .populate("classLevel")
    .populate("yearGroup")
    .populate("academicTerm")
    .populate("academicYear")
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
  const studentFound = await Student.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }

  const exam = await Exam.findById(req.params.examId)
    .populate("questions")
    .populate("subject")
    .populate("classLevel")
    .populate("yearGroup")
    .populate("academicTerm")
    .populate("academicYear");
  if (!exam || exam.isDeleted) {
    return res.status(404).json({
      status: "failed",
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
      message: "You have already taken this exam",
    });
  }

  if (studentFound.isSuspended || studentFound.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
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
  // get student
  const studentFound = await Student.findById(req.userAuth?._id);
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found or deleted",
    });
  }

  // get exam
  const examFound = await Exam.findById(req.params.examId)
    .populate("questions")
    .populate("academicTerm");
  if (!examFound) {
    return res.status(404).json({
      status: "failed",
      message: "Exam not found",
    });
  }

  if (examFound.examType === "project-submission") {
    return res.status(400).json({
      status: "failed",
      message:
        "This is a project-submission exam. Please use the upload form to submit your ZIP file.",
    });
  }

  //get quetions
  const questions = examFound?.questions;
  if (!questions) {
    return res.status(404).json({
      status: "failed",
      message: "Questions not found",
    });
  }

  //get student answers
  const studentAnswers = req.body.answers;
  if (!studentAnswers) {
    return res.status(404).json({
      status: "failed",
      message: "Student answers not found",
    });
  }

  // check if student asnwered all questions
  if (studentAnswers.length !== questions.length) {
    return res.status(400).json({
      status: "failed",
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
      message: "You have already taken this exam",
    });
  }

  // check is student is suspended

  if (studentFound?.isSuspended || studentFound?.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
      message: "You are suspended or withdrawn",
    });
  }

  // Build result object
  const passMark = examFound.passMark ?? 50;
  const totalMark = questions.reduce((sum, q) => sum + (q.mark || 1), 0);
  let score = 0;
  const answeredQuestions = [];
  let hasOpenEnded = false;

  for (let i = 0; i < questions.length; i++) {
    const question = questions[i];
    const studentAnswer = studentAnswers[i] ?? "";
    const qType = question.questionType || "multiple-choice";
    const qMark = question.mark || 1;

    if (qType === "open-ended") {
      hasOpenEnded = true;
      answeredQuestions.push({
        question: question.question,
        questionId: question._id,
        correctAnswer: question.correctAnswer || "",
        studentAnswer: String(studentAnswer),
        isCorrect: null,
        questionType: "open-ended",
        mark: qMark,
        pointsAwarded: 0,
        needsManualGrading: true,
      });
    } else {
      const isCorrect =
        String(question.correctAnswer).toUpperCase() ===
        String(studentAnswer).toUpperCase();
      if (isCorrect) score += qMark;
      answeredQuestions.push({
        question: question.question,
        questionId: question._id,
        correctAnswer: question.correctAnswer,
        studentAnswer: String(studentAnswer),
        isCorrect,
        questionType: "multiple-choice",
        mark: qMark,
        pointsAwarded: isCorrect ? qMark : 0,
        needsManualGrading: false,
      });
    }
  }

  const grade = totalMark > 0 ? (score / totalMark) * 100 : 0;
  let status = "Pending";
  if (!hasOpenEnded) {
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
    academicTerm: examFound?.academicTerm,
    isPublished: false,
    isFullyGraded: !hasOpenEnded,
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
  const examId = req.params.examId;

  const studentFound = await Student.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });
  if (!studentFound) {
    return res.status(404).json({
      status: "failed",
      message: "Student not found",
    });
  }

  if (studentFound.isSuspended || studentFound.isWithdrawn) {
    return res.status(400).json({
      status: "failed",
      message: "You are suspended or withdrawn",
    });
  }

  const examFound = await Exam.findById(examId)
    .populate("academicTerm")
    .populate("academicYear");
  if (!examFound || examFound.isDeleted) {
    return res.status(404).json({
      status: "failed",
      message: "Exam not found",
    });
  }

  if (examFound.examType !== "project-submission") {
    return res.status(400).json({
      status: "failed",
      message: "This exam is not a project-submission type",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      status: "failed",
      message: "No file uploaded. Please upload a .zip file.",
    });
  }

  const alreadySubmitted = await ExamResult.findOne({
    studentId: studentFound.studentId,
    exam: examFound._id,
  });
  if (alreadySubmitted) {
    return res.status(400).json({
      status: "failed",
      message: "You have already submitted a project for this exam",
    });
  }

  const passMark = examFound.passMark ?? 50;
  const totalMark = examFound.totalMark ?? 100;

  const examResult = await ExamResult.create({
    studentId: studentFound.studentId,
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
    academicTerm: examFound.academicTerm,
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
