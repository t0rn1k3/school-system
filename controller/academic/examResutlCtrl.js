const AsyncHandler = require("express-async-handler");
const ExamResult = require("../../model/Academic/ExamResults");
const Exam = require("../../model/Academic/Exam");
const Student = require("../../model/Academic/Student");

//@desc exam result checking
//@route GET /api/v1/exam-results/:id
//@access Private students only

exports.checkExamResultCtrl = AsyncHandler(async (req, res) => {
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

  const { id } = req.params;

  // Try by ExamResult _id first, then by exam _id (supports both URLs)
  let examResult = await ExamResult.findOne({
    studentId: studentFound.studentId,
    _id: id,
  })
    .populate("exam")
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear");

  if (!examResult) {
    // Find by exam ID - return most recent attempt (student may have taken it multiple times)
    examResult = await ExamResult.findOne({
      studentId: studentFound.studentId,
      exam: id,
    })
      .sort({ createdAt: -1 })
      .populate({
        path: "exam",
        populate: {
          path: "questions",
        },
      })
      .populate("classLevel")
      .populate("academicTerm")
      .populate("academicYear");
  }

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message:
        "No exam result found. You may not have taken this exam yet, or the result does not belong to you.",
    });
  }

  if (!examResult.isPublished) {
    return res.status(403).json({
      status: "failed",
      message:
        "Exam result not published yet. Please wait for your teacher to publish it.",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Exam result checked successfully",
    data: examResult,
  });
});

//@desc admin get all exam results
//@route GET /api/v1/admins/exam-results
//@access Private admins only

exports.adminGetAllExamResultsCtrl = AsyncHandler(async (req, res) => {
  const results = await ExamResult.find({})
    .populate("exam")
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear")
    .sort({ createdAt: -1 });
  res.status(200).json({
    status: "success",
    message: "Exam results fetched successfully",
    data: results,
  });
});

//@desc get all exam results (students)
//@route GET /api/v1/exam-results
//@access Private students only

exports.getAllExamResultsCtrl = AsyncHandler(async (req, res) => {
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

  const results = await ExamResult.find({
    studentId: studentFound.studentId,
    isPublished: true,
  })
    .populate("exam")
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    message: "Exam results fetched successfully",
    data: results,
  });
});

//@desc admin publish exam result
//@route PUT /api/v1/admins/publish/exam-result/:id
//@access Private admins only

exports.adminToggleExamResult = AsyncHandler(async (req, res) => {
  // find the exam result
  const examResult = await ExamResult.findById(req.params.id);
  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not found",
    });
  }

  const publishResult = await ExamResult.findByIdAndUpdate(
    req.params.id,
    {
      isPublished: req.body.publish,
    },
    {
      new: true,
    },
  );
  if (!publishResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not published",
    });
  }
  res.status(200).json({
    status: "success",
    message: "Exam result published successfully",
    data: publishResult,
  });
});

// ============ TEACHER EXAM RESULT CONTROLLERS ============

//@desc teacher get exam results for their exams
//@route GET /api/v1/teachers/exam-results
//@access Private teachers only

exports.teacherGetExamResultsCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examsCreated = await Exam.find({
    createdBy: teacherId,
    isDeleted: { $ne: true },
  }).select("_id");
  const examIds = examsCreated.map((e) => e._id);

  const results = await ExamResult.find({ exam: { $in: examIds } })
    .populate({
      path: "exam",
      populate: { path: "questions" },
    })
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear")
    .sort({ createdAt: -1 });

  res.status(200).json({
    status: "success",
    message: "Exam results fetched successfully",
    data: results,
  });
});

//@desc teacher get single exam result for grading
//@route GET /api/v1/teachers/exam-results/:id
//@access Private teachers only

exports.teacherGetExamResultCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examResult = await ExamResult.findById(req.params.id)
    .populate({
      path: "exam",
      populate: { path: "questions" },
    })
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear");

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not found",
    });
  }

  const exam = examResult.exam;
  if (!exam || exam.createdBy?.toString() !== teacherId.toString()) {
    return res.status(403).json({
      status: "failed",
      message: "You can only view exam results for exams you created",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Exam result fetched successfully",
    data: examResult,
  });
});

//@desc teacher grade open-ended questions in exam result
//@route PUT /api/v1/teachers/exam-results/:id/grade
//@access Private teachers only

exports.teacherGradeExamResultCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examResult = await ExamResult.findById(req.params.id).populate("exam");

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not found",
    });
  }

  if (
    !examResult.exam ||
    examResult.exam.createdBy?.toString() !== teacherId.toString()
  ) {
    return res.status(403).json({
      status: "failed",
      message: "You can only grade exam results for exams you created",
    });
  }

  const { gradedAnswers } = req.body;
  if (
    !gradedAnswers ||
    !Array.isArray(gradedAnswers) ||
    gradedAnswers.length === 0
  ) {
    return res.status(400).json({
      status: "failed",
      message:
        "gradedAnswers array required. Each item: { index: number, pointsAwarded: number }",
    });
  }

  const answeredQuestions = [...examResult.answeredQuestions];
  let totalNewScore = examResult.score;

  for (const g of gradedAnswers) {
    const idx = g.index;
    const pts = Number(g.pointsAwarded);
    if (
      idx < 0 ||
      idx >= answeredQuestions.length ||
      !Number.isFinite(pts) ||
      pts < 0
    ) {
      continue;
    }
    const aq = answeredQuestions[idx];
    if (aq.needsManualGrading && aq.questionType === "open-ended") {
      const oldPts = aq.pointsAwarded || 0;
      const maxPts = aq.mark || 1;
      const capped = Math.min(pts, maxPts);
      answeredQuestions[idx] = {
        question: aq.question,
        questionId: aq.questionId,
        correctAnswer: aq.correctAnswer,
        studentAnswer: aq.studentAnswer,
        isCorrect: capped >= maxPts * 0.5,
        questionType: aq.questionType,
        mark: maxPts,
        pointsAwarded: capped,
        needsManualGrading: false,
      };
      totalNewScore = totalNewScore - oldPts + capped;
    }
  }

  const totalMark =
    examResult.totalMark ||
    answeredQuestions.reduce((s, a) => s + (a.mark || 1), 0);
  const grade = totalMark > 0 ? (totalNewScore / totalMark) * 100 : 0;
  const status = grade >= (examResult.passMark || 50) ? "Passed" : "Failed";
  let remarks = "Poor";
  if (grade >= 80) remarks = "Excellent";
  else if (grade >= 70) remarks = "Very Good";
  else if (grade >= 60) remarks = "Good";
  else if (grade >= 50) remarks = "Average";

  const updated = await ExamResult.findByIdAndUpdate(
    req.params.id,
    {
      answeredQuestions,
      score: totalNewScore,
      grade,
      status,
      remarks,
      isFullyGraded: true,
    },
    { new: true }
  )
    .populate("exam")
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear");

  res.status(200).json({
    status: "success",
    message: "Exam result graded successfully",
    data: updated,
  });
});

//@desc teacher publish exam result (for exams they created)
//@route PUT /api/v1/teachers/exam-results/:id/publish
//@access Private teachers only

exports.teacherPublishExamResultCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examResult = await ExamResult.findById(req.params.id).populate("exam");

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not found",
    });
  }

  if (
    !examResult.exam ||
    examResult.exam.createdBy?.toString() !== teacherId.toString()
  ) {
    return res.status(403).json({
      status: "failed",
      message: "You can only publish exam results for exams you created",
    });
  }

  if (!examResult.isFullyGraded) {
    return res.status(400).json({
      status: "failed",
      message:
        "Cannot publish until all open-ended questions are graded. Use PUT /grade first.",
    });
  }

  const publishResult = await ExamResult.findByIdAndUpdate(
    req.params.id,
    { isPublished: true },
    { new: true }
  )
    .populate("exam")
    .populate("classLevel")
    .populate("academicTerm")
    .populate("academicYear");

  res.status(200).json({
    status: "success",
    message: "Exam result published successfully. Students can now view it.",
    data: publishResult,
  });
});
