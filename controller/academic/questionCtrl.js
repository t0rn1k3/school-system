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

  // check if question already exists

  const questionExists = await Question.findOne({
    question,
    isDeleted: { $ne: true },
  });
  if (questionExists) {
    return res.status(409).json({
      status: "failed",
      message: "Question already exists",
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

//@desc Get all questions
//@route GET /api/v1/questions
//@access Private teachers only
exports.getQuestions = AsyncHandler(async (req, res) => {
  const questions = await Question.find();
  res.status(200).json({
    status: "success",
    message: "Questions fetched successfully",
    data: questions,
  });
});

//@desc Get single question
//@route GET /api/v1/questions/:id
//@access Private teachers only
exports.getQuestion = AsyncHandler(async (req, res) => {
  const question = await Question.findById(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Question fetched successfully",
    data: question,
  });
});

//@desc Update question
//@route PUT /api/v1/questions/:id
//@access Private teachers only
exports.updateQuestion = AsyncHandler(async (req, res) => {
  const { question, optionA, optionB, optionC, optionD, correctAnswer } =
    req.body;

  // Build update object with only provided fields (partial update)
  const updateData = {};
  if (question !== undefined) updateData.question = question;
  if (optionA !== undefined) updateData.optionA = optionA;
  if (optionB !== undefined) updateData.optionB = optionB;
  if (optionC !== undefined) updateData.optionC = optionC;
  if (optionD !== undefined) updateData.optionD = optionD;
  if (correctAnswer !== undefined) updateData.correctAnswer = correctAnswer;

  const questionFound = await Question.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    updateData,
    { new: true, runValidators: true },
  );
  if (!questionFound) {
    return res.status(404).json({
      status: "failed",
      message: "Question not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Question updated successfully",
    data: questionFound,
  });
});
