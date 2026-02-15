const AsyncHandler = require("express-async-handler");
const ExamResult = require("../../model/Academic/ExamResults");
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

  // Students can always see their own result (published or not)
  res.status(200).json({
    status: "success",
    message: "Exam result checked successfully",
    data: examResult,
  });
});

//@desc get all exam results
//@route GET /api/v1/exam-results
//@access Private

exports.getAllExamResultsCtrl = AsyncHandler(async (req, res) => {
  const results = await ExamResult.find();
  res.status(200).json({
    status: "success",
    message: "Exam results fetched successfully",
    data: results,
  });
});
