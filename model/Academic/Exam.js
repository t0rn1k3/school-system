const mongoose = require("mongoose");

const { Schema } = mongoose;

//examSchema
const examSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    subject: {
      type: Schema.Types.ObjectId,
      ref: "Subject",
      required: false,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    module: {
      type: Schema.Types.ObjectId,
      ref: "Module",
      required: false,
    },
    passMark: {
      type: Number,
      required: true,
      default: 50,
    },
    totalMark: {
      type: Number,
      required: true,
      default: 100,
    },
    // "percentage" = score >= passMark%; "all-criteria" = all module criteria must pass
    passCriteriaType: {
      type: String,
      enum: ["percentage", "all-criteria"],
      default: "percentage",
    },
    // Which Learning Outcomes this exam targets (vocational modules)
    scopeType: {
      type: String,
      enum: ["single-lo", "multiple-los", "all-los"],
      default: "all-los",
    },
    learningOutcomeIds: [
      {
        type: String,
      },
    ],

    // Vocational: academic terms not used - kept optional for compatibility
    academicTerm: {
      type: Schema.Types.ObjectId,
      ref: "AcademicTerm",
      required: false,
    },
    duration: {
      type: String,
      required: true,
      default: "30 minutes",
    },
    examDate: {
      type: Date,
      required: true,
      default: new Date(),
    },
    examTime: {
      type: String,
      required: true,
    },
    examType: {
      type: String,
      required: true,
      default: "Quiz",
      // Quiz = questions; project-submission = student uploads ZIP file
      enum: ["Quiz", "project-submission"],
    },
    examStatus: {
      type: String,
      required: true,
      default: "pending",
      enum: ["pending", "live"],
    },
    questions: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    // Optional for vocational (use yearGroup instead)
    classLevel: {
      type: Schema.Types.ObjectId,
      ref: "ClassLevel",
      required: false,
    },
    // Group (e.g. 101, 102). Primary for vocational schools.
    yearGroup: {
      type: Schema.Types.ObjectId,
      ref: "YearGroup",
      required: false,
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Teacher",
      required: true,
    },
    academicYear: {
      type: Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
  },
  { timestamps: true },
);

const Exam = mongoose.model("Exam", examSchema);

module.exports = Exam;
