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
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
    },
    order: {
      type: Number,
      default: 0,
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
