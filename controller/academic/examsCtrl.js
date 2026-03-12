const AsyncHandler = require("express-async-handler");
const Exam = require("../../model/Academic/Exam");
const Module = require("../../model/Academic/Module");
const Teacher = require("../../model/Staff/Teacher");

//@desc create exam
//@route POST /api/v1/exams
//@access Private teachers only

exports.createExam = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.body_required",
      message: "Request body is required",
    });
  }

  const {
    name,
    description,
    subject,
    module,
    program,
    duration,
    examDate,
    examTime,
    examType,
    academicYear,
    classLevel,
    yearGroup,
    passMark,
    totalMark,
    passCriteriaType,
    scopeType,
    learningOutcomeIds,
  } = req.body;

  // Validate passMark (0-100) if provided
  if (passMark !== undefined) {
    const p = Number(passMark);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.pass_mark_range",
        message: "passMark must be a number between 0 and 100 (percentage)",
      });
    }
  }
  // Validate totalMark (positive) if provided
  if (totalMark !== undefined) {
    const t = Number(totalMark);
    if (!Number.isFinite(t) || t <= 0) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.total_mark_positive",
        message: "totalMark must be a positive number",
      });
    }
  }

  // Validate required fields - vocational: yearGroup OR classLevel; subject OR module
  if (
    !name ||
    !description ||
    !program ||
    !duration ||
    !examTime ||
    !examType ||
    !academicYear
  ) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.fields_required",
      message:
        "All required fields must be provided: name, description, program, duration, examTime, examType, academicYear. Provide yearGroup or classLevel. Provide subject or module.",
    });
  }
  if (!subject && !module) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.subject_or_module",
      message: "Either subject or module must be provided",
    });
  }
  if (!yearGroup && !classLevel) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.year_group_or_class",
      message: "Either yearGroup or classLevel must be provided",
    });
  }

  const validExamTypes = ["Quiz", "project-submission"];
  if (!validExamTypes.includes(examType)) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.invalid_exam_type",
      message: `examType must be one of: ${validExamTypes.join(", ")}`,
    });
  }
  const validPassCriteriaTypes = ["percentage", "all-criteria"];
  if (
    passCriteriaType !== undefined &&
    !validPassCriteriaTypes.includes(passCriteriaType)
  ) {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.invalid_pass_criteria",
      message: `passCriteriaType must be one of: ${validPassCriteriaTypes.join(", ")}`,
    });
  }

  const validScopeTypes = ["single-lo", "multiple-los", "all-los"];
  const finalScopeType =
    scopeType && validScopeTypes.includes(scopeType) ? scopeType : "all-los";
  const loIds = Array.isArray(learningOutcomeIds) ? learningOutcomeIds.filter(Boolean).map(String) : [];

  if (finalScopeType === "single-lo" || finalScopeType === "multiple-los") {
    if (!module) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.module_required_for_scope",
        message: "module is required when scopeType is single-lo or multiple-los",
      });
    }
    if (loIds.length === 0) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.learning_outcome_ids_required",
        message: "learningOutcomeIds is required when scopeType is single-lo or multiple-los",
      });
    }
    {
      const moduleDoc = await Module.findById(module).select("learningOutcomes");
      const moduleLoIds = new Set(
        (moduleDoc?.learningOutcomes || []).map((lo) => String(lo.id))
      );
      const invalid = loIds.filter((id) => !moduleLoIds.has(id));
      if (invalid.length > 0) {
        return res.status(400).json({
          status: "failed",
          messageKey: "exam.learning_outcome_ids_invalid",
          message: `learningOutcomeIds not found in module: ${invalid.join(", ")}`,
        });
      }
    }
  }

  //find the teacher
  const teacherFound = await Teacher.findOne({
    _id: req.userAuth._id,
    isDeleted: { $ne: true },
  });

  if (!teacherFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.teacher_not_found",
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
      messageKey: "exam.already_exists",
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
          messageKey: "exam.invalid_date",
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
          messageKey: "exam.invalid_date",
          message: "Invalid examDate format",
        });
      }
    }
  } else {
    parsedExamDate = new Date(); // Default to current date
  }

  const examCreated = await Exam.create({
    name,
    description,
    ...(subject && { subject }),
    ...(module && { module }),
    program,
    duration,
    examDate: parsedExamDate,
    examTime,
    examType,
    academicYear,
    ...(classLevel && { classLevel }),
    ...(yearGroup && { yearGroup }),
    ...(passMark !== undefined && { passMark: Number(passMark) }),
    ...(totalMark !== undefined && { totalMark: Number(totalMark) }),
    ...(passCriteriaType && { passCriteriaType }),
    scopeType: finalScopeType,
    learningOutcomeIds: finalScopeType === "all-los" ? [] : loIds,
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
//@access Private (teachers see own exams; admin via /admins/exams sees all)
exports.getExams = AsyncHandler(async (req, res) => {
  const filter = { isDeleted: { $ne: true } };
  // When called by teacher (isTeacherLogin), filter to their exams only
  if (req.userAuth && req.userAuth.role === "teacher") {
    filter.createdBy = req.userAuth._id;
  }
  const exams = await Exam.find(filter).populate({
    path: "questions",
    populate: {
      path: "createdBy",
    },
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
  const filter = { _id: req.params.id, isDeleted: { $ne: true } };
  if (req.userAuth && req.userAuth.role === "teacher") {
    filter.createdBy = req.userAuth._id;
  }
  const exam = await Exam.findOne(filter)
    .populate("questions")
    .populate("module");

  if (!exam) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.not_found",
      message: "Exam not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Exam fetched successfully",
    data: exam,
  });
});

//@desc Update exam
//@route PUT /api/v1/exams/:id
//@access Private

exports.updateExam = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "exam.body_required",
      message: "Request body is required",
    });
  }

  const {
    name,
    description,
    subject,
    module,
    program,
    duration,
    examDate,
    examTime,
    examType,
    academicYear,
    classLevel,
    yearGroup,
    passMark,
    totalMark,
    passCriteriaType,
    scopeType,
    learningOutcomeIds,
  } = req.body;

  // Validate passMark (0-100) if provided
  if (passMark !== undefined) {
    const p = Number(passMark);
    if (!Number.isFinite(p) || p < 0 || p > 100) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.pass_mark_range",
        message: "passMark must be a number between 0 and 100 (percentage)",
      });
    }
  }
  if (totalMark !== undefined) {
    const t = Number(totalMark);
    if (!Number.isFinite(t) || t <= 0) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.total_mark_positive",
        message: "totalMark must be a positive number",
      });
    }
  }

  if (examType !== undefined) {
    const validExamTypes = ["Quiz", "project-submission"];
    if (!validExamTypes.includes(examType)) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.invalid_exam_type",
        message: `examType must be one of: ${validExamTypes.join(", ")}`,
      });
    }
  }
  if (passCriteriaType !== undefined) {
    const validPassCriteriaTypes = ["percentage", "all-criteria"];
    if (!validPassCriteriaTypes.includes(passCriteriaType)) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.invalid_pass_criteria",
        message: `passCriteriaType must be one of: ${validPassCriteriaTypes.join(", ")}`,
      });
    }
  }

  const validScopeTypes = ["single-lo", "multiple-los", "all-los"];
  if (scopeType !== undefined) {
    if (!validScopeTypes.includes(scopeType)) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.invalid_scope_type",
        message: `scopeType must be one of: ${validScopeTypes.join(", ")}`,
      });
    }
  }
  const loIds = Array.isArray(learningOutcomeIds) ? learningOutcomeIds.filter(Boolean).map(String) : [];
  const existingExam = await Exam.findById(req.params.id).select("scopeType module");
  const scopeForValidation = scopeType !== undefined ? scopeType : existingExam?.scopeType || "all-los";
  if (scopeForValidation === "single-lo" || scopeForValidation === "multiple-los") {
    const modId = module !== undefined ? module : existingExam?.module;
    if (!modId) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.module_required_for_scope",
        message: "module is required when scopeType is single-lo or multiple-los",
      });
    }
    if (scopeType !== undefined && loIds.length === 0) {
      return res.status(400).json({
        status: "failed",
        messageKey: "exam.learning_outcome_ids_required",
        message: "learningOutcomeIds is required when scopeType is single-lo or multiple-los",
      });
    }
    if (loIds.length > 0) {
      const moduleDoc = await Module.findById(modId).select("learningOutcomes");
      const moduleLoIds = new Set(
        (moduleDoc?.learningOutcomes || []).map((lo) => String(lo.id))
      );
      const invalid = loIds.filter((id) => !moduleLoIds.has(id));
      if (invalid.length > 0) {
        return res.status(400).json({
          status: "failed",
          messageKey: "exam.learning_outcome_ids_invalid",
          message: `learningOutcomeIds not found in module: ${invalid.join(", ")}`,
        });
      }
    }
  }

  // Check if name already exists (only if name is being updated, exclude current exam)
  if (name) {
    const examFound = await Exam.findOne({
      name,
      _id: { $ne: req.params.id }, // Exclude current exam
      isDeleted: { $ne: true }, // Ignore soft-deleted exams
    });
    if (examFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "exam.name_exists",
        message: "Exam name already exists",
      });
    }
  }

  // Parse examDate if provided (same logic as create)
  let parsedExamDate;
  if (examDate !== undefined) {
    if (typeof examDate === "string") {
      const cleanedDate = examDate.replace(/(\d+)(st|nd|rd|th)\s+/i, "$1 ");
      parsedExamDate = new Date(cleanedDate);

      if (isNaN(parsedExamDate.getTime())) {
        const currentYear = new Date().getFullYear();
        parsedExamDate = new Date(`${cleanedDate} ${currentYear}`);
      }

      if (isNaN(parsedExamDate.getTime())) {
        return res.status(400).json({
          status: "failed",
          messageKey: "exam.invalid_date",
          message: "Invalid examDate format. Please use a valid date format",
        });
      }
    } else if (examDate instanceof Date) {
      parsedExamDate = examDate;
    } else {
      parsedExamDate = new Date(examDate);
      if (isNaN(parsedExamDate.getTime())) {
        return res.status(400).json({
          status: "failed",
          messageKey: "exam.invalid_date",
          message: "Invalid examDate format",
        });
      }
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (subject !== undefined) updateData.subject = subject;
  if (module !== undefined) updateData.module = module;
  if (passCriteriaType !== undefined) updateData.passCriteriaType = passCriteriaType;
  if (scopeType !== undefined) {
    updateData.scopeType = scopeType;
    updateData.learningOutcomeIds = scopeType === "all-los" ? [] : loIds;
  } else if (learningOutcomeIds !== undefined) {
    const existing = await Exam.findById(req.params.id).select("scopeType");
    const st = existing?.scopeType || "all-los";
    if (st === "single-lo" || st === "multiple-los") {
      updateData.learningOutcomeIds = loIds;
    }
  }
  if (program !== undefined) updateData.program = program;
  // if (academicTerm !== undefined) updateData.academicTerm = academicTerm; // Vocational: academic terms not used
  if (duration !== undefined) updateData.duration = duration;
  if (examDate !== undefined) updateData.examDate = parsedExamDate;
  if (examTime !== undefined) updateData.examTime = examTime;
  if (examType !== undefined) updateData.examType = examType;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (classLevel !== undefined) updateData.classLevel = classLevel;
  if (yearGroup !== undefined) updateData.yearGroup = yearGroup;
  if (passMark !== undefined) updateData.passMark = Number(passMark);
  if (totalMark !== undefined) updateData.totalMark = Number(totalMark);
  // Don't update createdBy on update

  const updateFilter = {
    _id: req.params.id,
    isDeleted: { $ne: true }, // Ignore soft-deleted exams
  };
  if (req.userAuth && req.userAuth.role === "teacher") {
    updateFilter.createdBy = req.userAuth._id;
  }
  const examUploaded = await Exam.findOneAndUpdate(
    updateFilter,
    updateData,
    {
      new: true,
      runValidators: true,
    },
  );

  if (!examUploaded) {
    return res.status(404).json({
      status: "failed",
      messageKey: "exam.not_found",
      message: "Exam not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Exam updated successfully",
    data: examUploaded,
  });
});
