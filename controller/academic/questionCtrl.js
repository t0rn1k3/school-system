const AsyncHandler = require("express-async-handler");
const Question = require("../../model/Academic/Question");
const Exam = require("../../model/Academic/Exam");

//@desc Create question
//@route POST /api/v1/questions/:examId
//@access Private teachers only

exports.createQuestion = AsyncHandler(async (req, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer } =
    req.body;

  //find the exam

  const examFound = await Exam.findById(req.params.examId);

  if (!examFound) {
    return res.status(404).json({
      status: "failed",
      message: "Exam not found",
    });
  }

  //create question

  const questionCreated = await Question.create({
    question,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    createdBy: req.userAuth._id,
  });

  //add question to the exam
  examFound.questions.push(questionCreated?._id);
  //save the exam
  await examFound.save();
  res.status(201).json({
    status: "success",
    message: "Question created successfully",
    data: questionCreated,
  });
});
