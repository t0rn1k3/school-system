const AsyncHandler = require("express-async-handler");
// CRITERIA_DISABLED: const { getEffectiveCriteriaForExam } = require("../../utils/learningOutcomesUtils");
const path = require("path");
const fs = require("fs");
const ExamResult = require("../../model/Academic/ExamResults");
const Exam = require("../../model/Academic/Exam");
const Module = require("../../model/Academic/Module");
const Student = require("../../model/Academic/Student");
const { checkAndGraduateStudent } = require("../../utils/graduationHelper");

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
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  const { id } = req.params;

  // Try by ExamResult _id first, then by exam _id (supports both URLs)
  let examResult = await ExamResult.findOne({
    studentId: studentFound.studentId,
    _id: id,
  })
    .populate({ path: "exam", populate: { path: "questions" } })
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
      .populate("student", "name")
      .populate("classLevel")
      .populate("yearGroup")
      // .populate("academicTerm") // Vocational: academic terms not used
      .populate("academicYear");
  }

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam_result.no_result_found",
      message:
        "No exam result found. You may not have taken this exam yet, or the result does not belong to you.",
    });
  }

  if (!examResult.isPublished) {
    return res.status(403).json({
      status: "failed",
      messageKey: "exam_result.not_published",
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
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
      messageKey: "student.not_found",
      message: "Student not found",
    });
  }

  const results = await ExamResult.find({
    studentId: studentFound.studentId,
    isPublished: true,
  })
    .populate("exam")
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
      populate: [
        { path: "questions" },
        { path: "module" },
      ],
    })
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
      messageKey: "exam_result.teacher_view_only",
      message: "You can only view exam results for exams you created",
    });
  }

  // CRITERIA_DISABLED: Criteria-based grading hidden; use percentage only. To restore, uncomment:
  // let effectiveCriteria = [];
  // if (exam?.passCriteriaType === "all-criteria" && exam?.module) {
  //   const moduleDoc = typeof exam.module === "object" ? exam.module : await Module.findById(exam.module);
  //   effectiveCriteria = getEffectiveCriteriaForExam(moduleDoc || {}, exam);
  // }
  const data = examResult.toObject ? examResult.toObject() : { ...examResult };
  data.effectiveCriteria = []; // CRITERIA_DISABLED: was effectiveCriteria

  res.status(200).json({
    status: "success",
    message: "Exam result fetched successfully",
    data,
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
      messageKey: "exam_result.teacher_grade_only",
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
    if (aq.needsManualGrading) {
      const oldPts = aq.pointsAwarded || 0;
      const maxPts = aq.mark || 1;
      const capped = Math.min(pts, maxPts);
      answeredQuestions[idx] = {
        question: aq.question,
        questionId: aq.questionId,
        correctAnswer: aq.correctAnswer,
        studentAnswer: aq.studentAnswer,
        studentAnswerPayload: aq.studentAnswerPayload,
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

  const hasUngradedManual =
    answeredQuestions.some((a) => a.needsManualGrading === true);

  const updated = await ExamResult.findByIdAndUpdate(
    req.params.id,
    {
      answeredQuestions,
      score: totalNewScore,
      grade,
      status,
      remarks,
      isFullyGraded: !hasUngradedManual,
    },
    { new: true },
  )
    .populate("exam")
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
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
      messageKey: "exam_result.teacher_publish_only",
      message: "You can only publish exam results for exams you created",
    });
  }

  if (!examResult.isFullyGraded) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam_result.cannot_publish_ungraded",
      message:
        "Cannot publish until all questions requiring manual grading are graded. Use PUT /grade first.",
    });
  }

  const publishResult = await ExamResult.findByIdAndUpdate(
    req.params.id,
    { isPublished: true },
    { new: true },
  )
    .populate("exam")
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
    .populate("academicYear");

  // Automatic graduation: if Passed, check if student has passed all program modules
  if (publishResult.status === "Passed" && publishResult.student?._id) {
    await checkAndGraduateStudent(publishResult.student._id.toString());
  }

  res.status(200).json({
    status: "success",
    message: "Exam result published successfully. Students can now view it.",
    data: publishResult,
  });
});

//@desc teacher download project submission
//@route GET /api/v1/teachers/exam-results/:id/download
//@access Private teachers only

exports.teacherDownloadProjectCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examResult = await ExamResult.findById(req.params.id).populate("exam");

  if (!examResult || !examResult.submittedFile?.path) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result or project file not found",
    });
  }

  const exam = examResult.exam;
  if (!exam || exam.createdBy?.toString() !== teacherId.toString()) {
    return res.status(403).json({
      status: "failed",
      messageKey: "exam_result.teacher_download_only",
      message: "You can only download projects for exams you created",
    });
  }

  const filePath = path.isAbsolute(examResult.submittedFile.path)
    ? examResult.submittedFile.path
    : path.join(process.cwd(), examResult.submittedFile.path);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: "failed",
      message: "File no longer exists on server",
    });
  }

  const downloadName =
    examResult.submittedFile.originalName ||
    examResult.submittedFile.filename ||
    "project.zip";
  res.download(filePath, downloadName);
});

//@desc admin download project submission
//@route GET /api/v1/admins/exam-results/:id/download
//@access Private admins only

exports.adminDownloadProjectCtrl = AsyncHandler(async (req, res) => {
  const examResult = await ExamResult.findById(req.params.id);

  if (!examResult || !examResult.submittedFile?.path) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result or project file not found",
    });
  }

  const filePath = path.isAbsolute(examResult.submittedFile.path)
    ? examResult.submittedFile.path
    : path.join(process.cwd(), examResult.submittedFile.path);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      status: "failed",
      message: "File no longer exists on server",
    });
  }

  const downloadName =
    examResult.submittedFile.originalName ||
    examResult.submittedFile.filename ||
    "project.zip";
  res.download(filePath, downloadName);
});

//@desc teacher grade project submission
//@route PUT /api/v1/teachers/exam-results/:id/grade-project
//@access Private teachers only

exports.teacherGradeProjectCtrl = AsyncHandler(async (req, res) => {
  const teacherId = req.userAuth._id;
  const examResult = await ExamResult.findById(req.params.id).populate("exam");

  if (!examResult) {
    return res.status(404).json({
      status: "failed",
      message: "Exam result not found",
    });
  }

  if (!examResult.submittedFile?.path) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam_result.not_project_submission",
      message:
        "This is not a project submission. Use the regular grade endpoint.",
    });
  }

  if (
    !examResult.exam ||
    examResult.exam.createdBy?.toString() !== teacherId.toString()
  ) {
    return res.status(403).json({
      status: "failed",
      message: "You can only grade project submissions for exams you created",
    });
  }

  const { score, totalMark, status, remarks /* CRITERIA_DISABLED: , criterionResults */ } = req.body;
  const exam = examResult.exam;
  // CRITERIA_DISABLED: passCriteriaType - always use percentage
  // const passCriteriaType = exam?.passCriteriaType || "percentage";

  let updatePayload = { isFullyGraded: true };
  let finalStatus;
  let finalRemarks = "Poor";
  let numScore;
  let total;
  let grade;

  // CRITERIA_DISABLED: all-criteria branch commented out. Use percentage only.
  // if (passCriteriaType === "all-criteria" && criterionResults && Array.isArray(criterionResults) && ...) { ... } else {
  // Percentage mode: use score/totalMark
    if (score === undefined || !Number.isFinite(Number(score))) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam_result.score_required",
        message: "score is required and must be a number",
      });
    }

    const totalVal =
      totalMark !== undefined ? Number(totalMark) : examResult.totalMark || 100;
    if (!Number.isFinite(totalVal) || totalVal <= 0) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam_result.total_mark_positive",
        message: "totalMark must be a positive number",
      });
    }

    numScore = Number(score);
    grade = totalVal > 0 ? (numScore / totalVal) * 100 : 0;
    const passMark = examResult.passMark ?? 50;
    const computedStatus = grade >= passMark ? "Passed" : "Failed";
    finalStatus =
      status && ["Passed", "Failed", "Pending"].includes(status)
        ? status
        : computedStatus;

    if (
      remarks &&
      ["Excellent", "Very Good", "Good", "Average", "Poor"].includes(remarks)
    ) {
      finalRemarks = remarks;
    } else if (grade >= 80) finalRemarks = "Excellent";
    else if (grade >= 70) finalRemarks = "Very Good";
    else if (grade >= 60) finalRemarks = "Good";
    else if (grade >= 50) finalRemarks = "Average";

    updatePayload = {
      ...updatePayload,
      score: Math.min(numScore, totalVal),
      grade,
      totalMark: totalVal,
      status: finalStatus,
      remarks: finalRemarks,
    };
    // CRITERIA_DISABLED: criterionResults storage commented out
    // if (criterionResults && Array.isArray(criterionResults)) { updatePayload.criterionResults = ...; }

  const updated = await ExamResult.findByIdAndUpdate(
    req.params.id,
    updatePayload,
    { new: true },
  )
    .populate("exam")
    .populate("student", "name")
    .populate("classLevel")
    .populate("yearGroup")
    // .populate("academicTerm") // Vocational: academic terms not used
    .populate("academicYear");

  res.status(200).json({
    status: "success",
    message: "Project graded successfully",
    data: updated,
  });
});
