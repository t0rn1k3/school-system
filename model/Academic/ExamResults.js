const mongoose = require("mongoose");

const { Schema } = mongoose;

//exam result schema
const examResultSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    exam: {
      type: Schema.Types.ObjectId,
      ref: "Exam",
      required: true,
    },
    grade: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    passMark: {
      type: Number,
      required: true,
      default: 50,
    },
    totalMark: {
      type: Number,
      default: 100,
    },
    // Failed/Passed/Pending (Pending = open-ended questions awaiting teacher grading)
    status: {
      type: String,
      required: true,
      enum: ["Failed", "Passed", "Pending"],
      default: "Pending",
    },
    //Excellent/Good/Poor
    remarks: {
      type: String,
      required: true,
      enum: ["Excellent", "Very Good", "Good", "Average", "Poor"],
      default: "Poor",
    },
    answeredQuestions: [
      {
        question: { type: String },
        questionId: { type: Schema.Types.ObjectId, ref: "Question" },
        correctAnswer: { type: String },
        studentAnswer: { type: String },
        isCorrect: { type: Boolean }, // null for open-ended until teacher grades
        questionType: { type: String, enum: ["multiple-choice", "open-ended"] },
        mark: { type: Number, default: 1 }, // max points for this question
        pointsAwarded: { type: Number, default: 0 }, // teacher-assigned points for open-ended
        needsManualGrading: { type: Boolean, default: false },
      },
    ],
    // true when all questions (including open-ended) are graded
    isFullyGraded: { type: Boolean, default: false },

    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    academicTerm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: true,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

const ExamResult = mongoose.model("ExamResult", examResultSchema);

module.exports = ExamResult;
