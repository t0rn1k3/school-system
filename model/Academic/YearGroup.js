const mongoose = require("mongoose");

const yearGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    academicYear: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AcademicYear",
      required: true,
    },
    program: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Program",
      required: false,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

yearGroupSchema.index({ program: 1 });
yearGroupSchema.index({ academicYear: 1 });
yearGroupSchema.index({ isDeleted: 1 });

const YearGroup = mongoose.model("YearGroup", yearGroupSchema);

module.exports = YearGroup;
