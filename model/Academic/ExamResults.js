const mongoose = require("mongoose");

const { Schema } = mongoose;

//exam result schema
const examResultSchema = new Schema(
  {
    studentId: {
      type: String,
      required: true,
    },
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: false,
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
        // For structured types (gap-fill, matching, etc.): array/object. Fallback: studentAnswer
        studentAnswerPayload: { type: Schema.Types.Mixed },
        isCorrect: { type: Boolean }, // null for open-ended until teacher grades
        questionType: {
          type: String,
          enum: [
            "multiple-choice",
            "open-ended",
            "gap-fill",
            "translation",
            "correct-mistake",
            "matching",
            "sentence-ordering",
            "long-form",
          ],
        },
        mark: { type: Number, default: 1 }, // max points for this question
        pointsAwarded: { type: Number, default: 0 }, // teacher-assigned points for open-ended
        needsManualGrading: { type: Boolean, default: false },
      },
    ],
    // true when all questions (including open-ended) are graded
    isFullyGraded: { type: Boolean, default: false },

    // For passCriteriaType "all-criteria": per-criterion pass/fail
    criterionResults: [
      {
        criterionId: { type: String, required: true },
        criterionName: { type: String, required: true },
        passed: { type: Boolean, required: true },
        notes: { type: String },
      },
    ],

    // For project-submission exams: uploaded file reference
    submittedFile: {
      filename: { type: String }, // stored filename on disk
      path: { type: String }, // full path
      originalName: { type: String },
      mimeType: { type: String, default: "application/zip" },
      size: { type: Number },
      uploadedAt: { type: Date, default: Date.now },
    },

    classLevel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassLevel",
    },
    yearGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YearGroup",
    },
    // Vocational: academic terms not used - kept optional for compatibility
    academicTerm: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: false,
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
