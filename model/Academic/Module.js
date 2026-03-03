const mongoose = require("mongoose");
const { Schema } = mongoose;

const moduleSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    program: {
      type: Schema.Types.ObjectId,
      ref: "Program",
      required: true,
    },
    // Criteria: student must pass ALL to pass the module
    criteria: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
    // Teachers who teach this module (teacher can be in multiple programs/modules)
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    order: {
      type: Number,
      default: 0,
    },
    // Vocational curriculum fields
    code: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: ["professional", "commonProfessional", "general", "integratedGeneral"],
      default: "professional",
    },
    contactHours: {
      type: Number,
      default: 0,
    },
    independentHours: {
      type: Number,
      default: 0,
    },
    assessmentHours: {
      type: Number,
      default: 0,
    },
    durationWeeks: {
      type: Number,
      default: 0,
    },
    credits: {
      type: Number,
      default: 0,
    },
    startWeek: {
      type: Number,
      default: 1,
    },
    weeklyOverrides: {
      type: Map,
      of: Number,
      default: () => new Map(),
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

const Module = mongoose.model("Module", moduleSchema);
module.exports = Module;
