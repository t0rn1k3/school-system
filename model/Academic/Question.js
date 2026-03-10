const mongoose = require("mongoose");

const { Schema } = mongoose;

// Type-specific payload schemas for language tests (Georgian vocational: English, Georgian, etc.)
const gapFillPayloadSchema = new Schema(
  {
    // Text with blanks; use _____ or {0}, {1} for placeholder indices
    contentWithBlanks: { type: String, default: "" },
    wordBank: [{ type: String }],
    // Per blank: array of accepted values. Stored as JSON-friendly array of arrays
    correctAnswers: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false },
);

const translationPayloadSchema = new Schema(
  {
    sourceText: { type: String, default: "" },
    sourceLanguage: { type: String, default: "en" },
    targetLanguage: { type: String, default: "ka" },
    acceptedAnswers: [{ type: String }], // empty = manual grading only
  },
  { _id: false },
);

const correctMistakePayloadSchema = new Schema(
  {
    incorrectSentence: { type: String, default: "" },
    correctAnswers: [{ type: String }], // multiple accepted corrections
  },
  { _id: false },
);

const matchingPayloadSchema = new Schema(
  {
    leftItems: [{ type: String }],
    rightItems: [{ type: String }],
    // Pairs: [[leftIdx, rightIdx], ...] e.g. [[0,2],[1,0],[2,1],[3,3]]
    correctPairs: { type: Schema.Types.Mixed, default: [] },
  },
  { _id: false },
);

const sentenceOrderingPayloadSchema = new Schema(
  {
    jumbledWords: [{ type: String }],
    correctOrder: [{ type: Number }], // indices in correct order
  },
  { _id: false },
);

//questionSchema
const questionSchema = new Schema(
  {
    question: {
      type: String,
      required: true,
    },
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
    // Type-specific payload for language test question types
    gapFillPayload: gapFillPayloadSchema,
    translationPayload: translationPayloadSchema,
    correctMistakePayload: correctMistakePayloadSchema,
    matchingPayload: matchingPayloadSchema,
    sentenceOrderingPayload: sentenceOrderingPayloadSchema,
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
