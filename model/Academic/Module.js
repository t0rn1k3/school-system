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
    // Legacy: flat criteria (kept for backward compatibility; derive from learningOutcomes when present)
    criteria: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        description: { type: String, default: "" },
      },
    ],
    // Georgian vocational: Learning Outcomes, each with nested criteria
    learningOutcomes: [
      {
        id: { type: String, required: true },
        order: { type: Number, default: 0 },
        name: { type: String, required: true },
        description: { type: String, default: "" },
        criteria: [
          {
            id: { type: String, required: true },
            name: { type: String, required: true },
            description: { type: String, default: "" },
          },
        ],
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

moduleSchema.index({ program: 1 });
moduleSchema.index({ teachers: 1 });
moduleSchema.index({ isDeleted: 1 });
moduleSchema.index({ program: 1, isDeleted: 1 });

const Module = mongoose.model("Module", moduleSchema);
module.exports = Module;
