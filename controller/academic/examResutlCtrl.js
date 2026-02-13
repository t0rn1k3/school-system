const AsyncHandler = require("express-async-handler");

//@desc exam result checking
//@route GET /api/v1/exam-results/:id
//@access Private students only

exports.checkExamResultCtrl = AsyncHandler(async (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Exam result checked successfully",
  });
});
