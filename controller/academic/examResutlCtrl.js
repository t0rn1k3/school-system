const AsyncHandler = require("express-async-handler");
const ExamResult = require("../../model/Academic/ExamResults");

//@desc exam result checking
//@route GET /api/v1/exam-results/:id
//@access Private students only

exports.checkExamResultCtrl = AsyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Exam result checked successfully",
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
