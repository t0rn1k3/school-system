const AsyncHandler = require("express-async-handler");
const Student = require("../../model/Academic/Student");
const { hashPassword, isPasswordMatched } = require("../../utils/helpers");
const generateToken = require("../../utils/generateToken");
const bcrypt = require("bcryptjs");
const Exam = require("../../model/Academic/Exam");
const ExamResult = require("../../model/Academic/ExamResults");
const Program = require("../../model/Academic/Program");

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

//@dec student profile
//@route GET /api/v1/students/profile
//@access Private students only

exports.getStudentProfileCtrl = AsyncHandler(async (req, res) => {
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
  res.status(200).json({
    status: "success",
    data: student,
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
  const studentId = req.params.studentId;

  // Verify that the student can only update their own profile
  if (studentId !== req.userAuth._id.toString()) {
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
    student: studentFound?._id,
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
  let correctAnswers = 0;
  let wrongAnswers = 0;
  let totalQuestions = questions.length;
  let status = ""; // failed/passed
  let grade = 0;
  let score = 0;
  let answeredQuestions = [];

  // check for answers

  for (let i = 0; i < questions.length; i++) {
    // find the question
    const question = questions[i];
    //check if the answer is correct
    if (question.correctAnswer === studentAnswers[i]) {
      correctAnswers++;
      score++;
      question.isCorrect = true;
    } else {
      wrongAnswers++;
    }
  }

  //calculate reports

  grade = (score / totalQuestions) * 100;
  answeredQuestions = questions.map((question) => {
    return {
      question: question.question,
      correctAnswer: question.correctAnswer,
      isCorrect: question.isCorrect,
    };
  });

  //calculate status
  if (grade >= 50) {
    status = "Passed";
  } else {
    status = "Failed";
  }

  //calculate remarks
  if (grade >= 80) {
    remarks = "Excellent";
  } else if (grade >= 70) {
    remarks = "Very Good";
  } else if (grade >= 60) {
    remarks = "Good";
  } else if (grade >= 50) {
    remarks = "Average";
  } else {
    remarks = "Poor";
  }

  // Generate exam result (auto-publish so student can see their result after submitting)
  const examResult = await ExamResult.create({
    studentId: studentFound?.studentId,
    exam: examFound?._id,
    score,
    grade,
    answeredQuestions,
    status,
    remarks,
    classLevel: examFound?.classLevel,
    academicYear: examFound?.academicYear,
    academicTerm: examFound?.academicTerm,
    isPublished: true,
  });

  //push the exam result
  studentFound.examResults.push(examResult._id);
  await studentFound.save();

  // Promote student to next level (dynamic - based on program's classLevels)
  const shouldAttemptPromotion =
    examFound?.academicTerm?.name === "3rd term" && status === "Passed";

  if (shouldAttemptPromotion && studentFound.program) {
    const program = await Program.findById(studentFound.program).populate(
      "classLevels",
    );
    const levels = program?.classLevels || [];

    if (levels.length > 0 && studentFound.currentClassLevel) {
      const currentLevelId =
        typeof studentFound.currentClassLevel === "object"
          ? studentFound.currentClassLevel._id
          : studentFound.currentClassLevel;
      const currentIndex = levels.findIndex((l) =>
        l._id.equals(currentLevelId),
      );
      const nextLevel = levels[currentIndex + 1];

      if (nextLevel) {
        studentFound.classLevels.push(nextLevel._id);
        studentFound.currentClassLevel = nextLevel._id;
        await studentFound.save();
      } else if (currentIndex >= 0 && currentIndex === levels.length - 1) {
        studentFound.isGraduated = true;
        await studentFound.save();
      }
    }
  }

  res.status(200).json({
    status: "success",
    data: "you have submitted your exam successfully, you can now view your result in the result section",
  });
});
