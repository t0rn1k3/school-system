const AsyncHandler = require("express-async-handler");
const Exam = require("../../model/Academic/Exam");
const Teacher = require("../../model/Staff/Teacher");

//@desc create exam
//@route POST /api/v1/exams
//@access Private teachers only

exports.createExam = AsyncHandler(async (req, res) => {
  const {
    name,
    description,
    subject,
    program,
    academicTerm,
    duration,
    examDate,
    examTime,
    examType,
    createdBy,
    academicYear,
  } = req.body;

  //find the teacher
  const teacherFound = await Teacher.findById(req.userAuth._id);

  if (!teacherFound) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }

  //exam exists
  const examExists = await Exam.findOne({ name });
  if (examExists) {
    return res.status(409).json({
      status: "failed",
      message: "Exam already exists",
    });
  }

  // exam created

  const examCreated = await Exam.create({
    name,
    description,
    subject,
    program,
    academicTerm,
    duration,
    examDate,
    examTime,
    examType,
    createdBy,
    academicYear,
  });

  // push the exam to the teacher

  teacherFound.examsCreated.push(examCreated._id);
  await examCreated.save();
  await teacherFound.save();

  res.status(201).json({
    status: "success",
    message: "Exam created successfully",
    data: examCreated,
  });
});
