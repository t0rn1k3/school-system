const mongoose = require("mongoose");

const { Schema } = mongoose;

const ProgramSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    duration: {
      type: String,
      required: false,
      default: "4 years",
    },
    // Vocational: program length in weeks (e.g. 32 for Front-end Development)
    durationWeeks: {
      type: Number,
      required: false,
    },
    // created automatically
    //CSFTY
    code: {
      type: String,
      default: function () {
        return (
          this.name
            .split(" ")
            .map((name) => name[0])
            .join("")
            .toUpperCase() +
          Math.floor(10 + Math.random() * 90) +
          Math.floor(10 + Math.random() * 90)
        );
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
    //will push the teachers that are in charge of the program
    teachers: [
      {
        type: Schema.Types.ObjectId,
        ref: "Teacher",
      },
    ],
    students: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
        default: [],
      },
    ],
    //will push the subjects that are in the program when the program is created
    subjects: [
      {
        type: Schema.Types.ObjectId,
        ref: "Subject",
        default: [],
      },
    ],
    // Ordered list of class levels for this program (school-defined, e.g. Grade 1→4 or Level 100→400)
    classLevels: [
      {
        type: Schema.Types.ObjectId,
        ref: "ClassLevel",
      },
    ],
    // Vocational: modules (e.g. HTML/CSS, JavaScript) - student must pass all to graduate
    modules: [
      {
        type: Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
  },
  { timestamps: true },
);
const Program = mongoose.model("Program", ProgramSchema);

module.exports = Program;
