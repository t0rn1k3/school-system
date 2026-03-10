const AsyncHandler = require("express-async-handler");
const Question = require("../../model/Academic/Question");
const Exam = require("../../model/Academic/Exam");
const {
  QUESTION_TYPES,
  validateQuestionPayload,
  buildPayloadForType,
} = require("../../utils/questionTypeUtils");

//@desc Create question
//@route POST /api/v1/questions/:examId
//@access Private teachers only

exports.createQuestion = AsyncHandler(async (req, res) => {
  const {
    question,
    questionType = "multiple-choice",
    optionA = "",
    optionB = "",
    optionC = "",
    optionD = "",
    correctAnswer = "",
    mark = 1,
    gapFillPayload,
    translationPayload,
    correctMistakePayload,
    matchingPayload,
    sentenceOrderingPayload,
  } = req.body;

  //find the exam

  const examFound = await Exam.findById(req.params.examId);

  if (!examFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "question.exam_not_found",
      message: "Exam not found",
    });
  }

  if (!QUESTION_TYPES.includes(questionType)) {
    return res.status(400).json({
      status: "failed",
      messageKey: "question.type_invalid",
      message: `questionType must be one of: ${QUESTION_TYPES.join(", ")}`,
    });
  }

  // For multiple-choice, validate options and correctAnswer
  if (questionType === "multiple-choice") {
    if (!optionA || !optionB || !optionC || !optionD || !correctAnswer) {
      return res.status(400).json({
        status: "failed",
        messageKey: "question.mcq_options_required",
        message:
          "Multiple-choice questions require optionA, optionB, optionC, optionD, and correctAnswer",
      });
    }
    const validAnswers = ["A", "B", "C", "D"];
    if (!validAnswers.includes(String(correctAnswer).toUpperCase())) {
      return res.status(400).json({
        status: "failed",
        messageKey: "question.correct_answer_abcd",
        message: "correctAnswer must be A, B, C, or D",
      });
    }
  }

  // Validate type-specific payload for language test types
  const payloadValidation = validateQuestionPayload(questionType, req.body);
  if (!payloadValidation.valid) {
    return res.status(400).json({
      status: "failed",
      messageKey: "question.payload_validation",
      message: payloadValidation.message,
    });
  }

  const payload = buildPayloadForType(questionType, {
    gapFillPayload,
    translationPayload,
    correctMistakePayload,
    matchingPayload,
    sentenceOrderingPayload,
  });

  //create question

  const questionCreated = await Question.create({
    question,
    questionType,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer: String(correctAnswer).toUpperCase?.() || correctAnswer,
    mark,
    ...payload,
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
  const {
    question,
    questionType,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    mark,
    gapFillPayload,
    translationPayload,
    correctMistakePayload,
    matchingPayload,
    sentenceOrderingPayload,
  } = req.body;

  const existingQuestion = await Question.findById(req.params.id);
  if (!existingQuestion) {
    return res.status(404).json({
      status: "failed",
      messageKey: "question.not_found",
      message: "Question not found",
    });
  }

  const effectiveType = questionType !== undefined ? questionType : existingQuestion.questionType;
  if (questionType !== undefined && !QUESTION_TYPES.includes(questionType)) {
    return res.status(400).json({
      status: "failed",
      messageKey: "question.type_invalid",
      message: `questionType must be one of: ${QUESTION_TYPES.join(", ")}`,
    });
  }

  const bodyForValidation = {
    gapFillPayload: gapFillPayload ?? existingQuestion.gapFillPayload,
    translationPayload: translationPayload ?? existingQuestion.translationPayload,
    correctMistakePayload: correctMistakePayload ?? existingQuestion.correctMistakePayload,
    matchingPayload: matchingPayload ?? existingQuestion.matchingPayload,
    sentenceOrderingPayload:
      sentenceOrderingPayload ?? existingQuestion.sentenceOrderingPayload,
  };
  const payloadValidation = validateQuestionPayload(effectiveType, bodyForValidation);
  if (!payloadValidation.valid) {
    return res.status(400).json({
      status: "failed",
      messageKey: "question.payload_validation",
      message: payloadValidation.message,
    });
  }

  // Build update object with only provided fields (partial update)
  const updateData = {};
  if (question !== undefined) updateData.question = question;
  if (questionType !== undefined) updateData.questionType = questionType;
  if (optionA !== undefined) updateData.optionA = optionA;
  if (optionB !== undefined) updateData.optionB = optionB;
  if (optionC !== undefined) updateData.optionC = optionC;
  if (optionD !== undefined) updateData.optionD = optionD;
  if (correctAnswer !== undefined)
    updateData.correctAnswer =
      typeof correctAnswer === "string"
        ? correctAnswer.toUpperCase()
        : correctAnswer;
  if (mark !== undefined) updateData.mark = mark;
  if (gapFillPayload !== undefined) updateData.gapFillPayload = gapFillPayload;
  if (translationPayload !== undefined) updateData.translationPayload = translationPayload;
  if (correctMistakePayload !== undefined)
    updateData.correctMistakePayload = correctMistakePayload;
  if (matchingPayload !== undefined) updateData.matchingPayload = matchingPayload;
  if (sentenceOrderingPayload !== undefined)
    updateData.sentenceOrderingPayload = sentenceOrderingPayload;

  const questionFound = await Question.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    updateData,
    { new: true, runValidators: true },
  );
  if (!questionFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "question.not_found",
      message: "Question not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Question updated successfully",
    data: questionFound,
  });
});
