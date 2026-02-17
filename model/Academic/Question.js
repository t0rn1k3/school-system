const mongoose = require("mongoose");

const { Schema } = mongoose;

//questionSchema
const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
    questionType: {
      type: String,
      enum: ["multiple-choice", "open-ended"],
      default: "multiple-choice",
    },
    // For multiple-choice only (optional for open-ended)
    optionA: { type: String, default: "" },
    optionB: { type: String, default: "" },
    optionC: { type: String, default: "" },
    optionD: { type: String, default: "" },
    // For MCQ: correct answer (A/B/C/D). For open-ended: model answer (optional, for teacher reference)
    correctAnswer: { type: String, default: "" },
    // Points for this question (used in grading)
    mark: {
      type: Number,
      default: 1,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
