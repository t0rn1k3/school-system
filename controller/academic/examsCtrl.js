const AsyncHandler = require("express-async-handler");
const Exam = require("../../model/Academic/Exam");
const Teacher = require("../../model/Staff/Teacher");

//@desc create exam
//@route POST /api/v1/exams
//@access Private teachers only

exports.createExam = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

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
    academicYear,
    classLevel,
  } = req.body;

  // Validate required fields
  if (
    !name ||
    !description ||
    !subject ||
    !program ||
    !academicTerm ||
    !duration ||
    !examTime ||
    !examType ||
    !academicYear ||
    !classLevel
  ) {
    return res.status(400).json({
      status: "failed",
      message:
        "All required fields must be provided: name, description, subject, program, academicTerm, duration, examTime, examType, academicYear, classLevel",
    });
  }

  //find the teacher
  const teacherFound = await Teacher.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });

  if (!teacherFound) {
    return res.status(404).json({
      status: "failed",
      message: "Teacher not found",
    });
  }

  //exam exists (ignore soft-deleted)
  const examExists = await Exam.findOne({
    name,
    isDeleted: { $ne: true },
  });
  if (examExists) {
    return res.status(409).json({
      status: "failed",
      message: "Exam already exists",
    });
  }

  // Parse examDate - handle string dates like "20th December"
  let parsedExamDate;
  if (examDate) {
    if (typeof examDate === "string") {
      // Remove ordinal suffixes (st, nd, rd, th) and try parsing
      const cleanedDate = examDate.replace(/(\d+)(st|nd|rd|th)\s+/i, "$1 ");
      parsedExamDate = new Date(cleanedDate);

      // If invalid date, try adding current year
      if (isNaN(parsedExamDate.getTime())) {
        const currentYear = new Date().getFullYear();
        parsedExamDate = new Date(`${cleanedDate} ${currentYear}`);
      }

      // If still invalid, return error
      if (isNaN(parsedExamDate.getTime())) {
        return res.status(400).json({
          status: "failed",
          message:
            "Invalid examDate format. Please use a valid date format (e.g., '2024-12-20', 'December 20, 2024', or ISO date string)",
        });
      }
    } else if (examDate instanceof Date) {
      parsedExamDate = examDate;
    } else {
      parsedExamDate = new Date(examDate);
      if (isNaN(parsedExamDate.getTime())) {
        return res.status(400).json({
          status: "failed",
          message: "Invalid examDate format",
        });
      }
    }
  } else {
    parsedExamDate = new Date(); // Default to current date
  }

  // exam created
  const examCreated = await Exam.create({
    name,
    description,
    subject,
    program,
    academicTerm,
    duration,
    examDate: parsedExamDate,
    examTime,
    examType,
    academicYear,
    classLevel, // Added missing classLevel field
    createdBy: req.userAuth._id,
  });

  // push the exam to the teacher
  teacherFound.examsCreated.push(examCreated._id);
  await teacherFound.save();

  res.status(201).json({
    status: "success",
    message: "Exam created successfully",
    data: examCreated,
  });
});

//@desc Get all exams
//@route GET /api/v1/exams
//@access Private
exports.getExams = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted exams (handle documents without isDeleted field)
  const exams = await Exam.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  res.status(200).json({
    status: "success",
    message: "Exams fetched successfully",
    data: exams,
  });
});

//@desc Get single exam
//@route GET /api/v1/exams/:id
//@access Private
exports.getExam = AsyncHandler(async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  res.status(200).json({
    status: "success",
    message: "Exam fetched successfully",
    data: exam,
  });
});
