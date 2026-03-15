const AsyncHandler = require("express-async-handler");
const Module = require("../../model/Academic/Module");
const Program = require("../../model/Academic/Program");
const {
  distributeHoursEvenly,
  validateWeeklyOverrides,
  filterWeeklyOverridesToRange,
} = require("../../utils/curriculumUtils");
// FUTURE: criteria & learningOutcomes - disabled for now
// const { normalizeLearningOutcomes, migrateCriteriaToLearningOutcomes } = require("../../utils/learningOutcomesUtils");

/**
 * weeklyOverrides semantics:
 * - Week range: Only startWeek..startWeek+durationWeeks-1. Extra weeks are ignored in sum; stored data is filtered to range.
 * - Create: payload is the complete set, or we auto-generate. Stored weeks filtered to range.
 * - Update: MERGE. Incoming overwrites existing; validation on final merged object; stored filtered to range.
 * - Sum: sum(weeklyOverrides) === contactHours + assessmentHours (tolerance 0.01). independentHours excluded.
 * - Keys: String or number accepted (JSON keys are strings). Values parsed as numbers.
 * - Errors: module.weekly_hours_invalid (sum wrong); module.validation (other validation).
 */
//@desc Create module
//@route POST /api/v1/modules
//@access Private Admin

exports.createModule = AsyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "module.body_required",
      message: "Request body is required",
    });
  }

  const {
    name,
    description,
    program,
    order,
    teachers,
    code,
    type,
    contactHours,
    independentHours,
    assessmentHours,
    durationWeeks,
    credits,
    startWeek,
    weeklyOverrides: weeklyOverridesInput,
  } = req.body;

  if (!name || !description || !program) {
    return res.status(400).json({
      status: "failed",
      messageKey: "module.fields_required",
      message: "Name, description, and program are required",
    });
  }

  const ProgramModel = req.tenantModels?.Program || Program;
  const ModuleModel = req.tenantModels?.Module || Module;

  const programFound = await ProgramModel.findOne({
    _id: program,
    isDeleted: { $ne: true },
  });
  if (!programFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "module.program_not_found",
      message: "Program not found",
    });
  }

  const moduleNameExists = await ModuleModel.findOne({
    name,
    program,
    isDeleted: { $ne: true },
  });
  if (moduleNameExists) {
    return res.status(409).json({
      status: "failed",
      messageKey: "module.name_exists",
      message: "Module name already exists in this program",
    });
  }

  const teachersArray = Array.isArray(teachers)
    ? teachers.filter((t) => t)
    : [];

  const contact = Number(contactHours) || 0;
  const independent = Number(independentHours) || 0;
  const assessment = Number(assessmentHours) || 0;
  const weeks = Number(durationWeeks) || 0;
  const start = Number(startWeek) || 1;

  let weeklyOverridesMap = new Map();
  if (weeklyOverridesInput && typeof weeklyOverridesInput === "object") {
    const plain =
      weeklyOverridesInput instanceof Map
        ? Object.fromEntries(weeklyOverridesInput)
        : weeklyOverridesInput;
    const validation = validateWeeklyOverrides({
      contactHours: contact,
      assessmentHours: assessment,
      durationWeeks: weeks,
      startWeek: start,
      weeklyOverrides: plain,
    });
    if (!validation.valid) {
      return res.status(400).json({
        status: "failed",
        messageKey: "module.weekly_hours_invalid",
        message: validation.message,
      });
    }
    const filtered = filterWeeklyOverridesToRange(plain, start, weeks);
    Object.entries(filtered).forEach(([k, v]) => {
      weeklyOverridesMap.set(String(k), Number(v) || 0);
    });
  } else if (contact + assessment > 0 && weeks > 0) {
    const dist = distributeHoursEvenly(contact + assessment, weeks, start);
    Object.entries(dist).forEach(([k, v]) => {
      weeklyOverridesMap.set(String(k), v);
    });
  }

  // When contact+assessment > 0 and durationWeeks > 0: ensure weeklyOverrides exists and sum is correct.
  // Either we validated user-provided overrides above, or we auto-generated. Re-validate the final set.
  if (contact + assessment > 0 && weeks > 0) {
    const plain = Object.fromEntries(weeklyOverridesMap);
    const finalValidation = validateWeeklyOverrides({
      contactHours: contact,
      assessmentHours: assessment,
      durationWeeks: weeks,
      startWeek: start,
      weeklyOverrides: plain,
    });
    if (!finalValidation.valid) {
      return res.status(400).json({
        status: "failed",
        messageKey: "module.weekly_hours_invalid",
        message: finalValidation.message,
      });
    }
  }

  const validTypes = ["professional", "commonProfessional", "general", "integratedGeneral"];
  const moduleType = validTypes.includes(type) ? type : "professional";

  const moduleCreated = await ModuleModel.create({
    name,
    description,
    program,
    order: typeof order === "number" ? order : 0,
    teachers: teachersArray,
    code: code || undefined,
    type: moduleType,
    contactHours: contact,
    independentHours: independent,
    assessmentHours: assessment,
    durationWeeks: weeks,
    credits: Number(credits) || 0,
    startWeek: start,
    weeklyOverrides: weeklyOverridesMap,
    createdBy: req.userAuth._id,
  });

  programFound.modules = programFound.modules || [];
  programFound.modules.push(moduleCreated._id);
  await programFound.save();

  const populated = await ModuleModel.findById(moduleCreated._id)
    .populate("program", "name code")
    .populate("teachers", "name email teacherId");

  res.status(201).json({
    status: "success",
    message: "Module created successfully",
    data: populated,
  });
});

//@desc Get all modules
//@route GET /api/v1/modules (optional query: ?program=id, ?teacher=teacherId)
//@access Private (Teacher: may only filter by own ID; Admin: any filter)
//@response Each module includes program (populated) so frontend can derive teacher's programs

exports.getModules = AsyncHandler(async (req, res) => {
  const ModuleModel = req.tenantModels?.Module || Module;
  const filter = { isDeleted: { $ne: true } };
  if (req.query.program) {
    filter.program = req.query.program;
  }
  if (req.query.teacher) {
    if (req.userAuth?.role === "teacher") {
      filter.teachers = req.userAuth._id;
    } else {
      filter.teachers = req.query.teacher;
    }
  }

  const modules = await ModuleModel.find(filter)
    .populate("program", "name code")
    .populate("teachers", "name email teacherId")
    .sort({ order: 1, createdAt: 1 })
    .lean();

  res.status(200).json({
    status: "success",
    message: "Modules fetched successfully",
    data: modules,
  });
});

//@desc Get single module
//@route GET /api/v1/modules/:id
//@access Private

exports.getModule = AsyncHandler(async (req, res) => {
  const ModuleModel = req.tenantModels?.Module || Module;
  const module = await ModuleModel.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .populate("program", "name code durationWeeks")
    .populate("teachers", "name email teacherId")
    .lean();

  if (!module) {
    return res.status(404).json({
      status: "failed",
      messageKey: "module.not_found",
      message: "Module not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Module fetched successfully",
    data: module,
  });
});

//@desc Update module
//@route PUT /api/v1/modules/:id
//@access Private Admin

exports.updateModule = AsyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "module.body_required",
      message: "Request body is required",
    });
  }

  const ModuleModel = req.tenantModels?.Module || Module;
  const ProgramModel = req.tenantModels?.Program || Program;

  const {
    name,
    description,
    order,
    teachers,
    code,
    type,
    contactHours,
    independentHours,
    assessmentHours,
    durationWeeks,
    credits,
    startWeek,
    weeklyOverrides: weeklyOverridesInput,
  } = req.body;

  const existingModule = await ModuleModel.findById(req.params.id);
  if (!existingModule) {
    return res.status(404).json({
      status: "failed",
      messageKey: "module.not_found",
      message: "Module not found",
    });
  }

  if (name) {
    const moduleFound = await ModuleModel.findOne({
      name,
      program: existingModule.program,
      isDeleted: { $ne: true },
      _id: { $ne: req.params.id },
    });
    if (moduleFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "module.name_exists",
        message: "Module name already exists in this program",
      });
    }
  }

  if (weeklyOverridesInput !== undefined && weeklyOverridesInput !== null) {
    // Merge: incoming weeks overwrite; weeks not in payload keep existing values
    const existingPlain = existingModule.weeklyOverrides instanceof Map
      ? Object.fromEntries(existingModule.weeklyOverrides)
      : (existingModule.weeklyOverrides || {});
    const incomingPlain = weeklyOverridesInput instanceof Map
      ? Object.fromEntries(weeklyOverridesInput)
      : weeklyOverridesInput;
    const merged = { ...existingPlain };
    Object.entries(incomingPlain).forEach(([k, v]) => {
      const num = Number(v);
      if (!Number.isNaN(num) && num >= 0) {
        merged[String(k)] = num;
      } else if (v === "" || v === null || v === undefined) {
        merged[String(k)] = 0;
      }
    });

    const moduleForValidation = {
      ...existingModule.toObject(),
      contactHours: contactHours !== undefined ? Number(contactHours) : existingModule.contactHours,
      assessmentHours: assessmentHours !== undefined ? Number(assessmentHours) : existingModule.assessmentHours,
      durationWeeks: durationWeeks !== undefined ? Number(durationWeeks) : existingModule.durationWeeks,
      startWeek: startWeek !== undefined ? Number(startWeek) : existingModule.startWeek,
      weeklyOverrides: merged,
    };
    const validation = validateWeeklyOverrides(moduleForValidation);
    if (!validation.valid) {
      return res.status(400).json({
        status: "failed",
        messageKey: "module.weekly_hours_invalid",
        message: validation.message,
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (order !== undefined && Number.isFinite(Number(order)))
    updateData.order = Number(order);
  // FUTURE: criteria & learningOutcomes update logic - disabled for now
  if (teachers !== undefined && Array.isArray(teachers)) {
    updateData.teachers = teachers.filter((t) => t);
  }
  if (code !== undefined) updateData.code = code || null;
  if (type !== undefined) {
    const validTypes = ["professional", "commonProfessional", "general", "integratedGeneral"];
    updateData.type = validTypes.includes(type) ? type : "professional";
  }
  if (contactHours !== undefined) updateData.contactHours = Number(contactHours) || 0;
  if (independentHours !== undefined) updateData.independentHours = Number(independentHours) || 0;
  if (assessmentHours !== undefined) updateData.assessmentHours = Number(assessmentHours) || 0;
  if (durationWeeks !== undefined) updateData.durationWeeks = Number(durationWeeks) || 0;
  if (credits !== undefined) updateData.credits = Number(credits) || 0;
  if (startWeek !== undefined) updateData.startWeek = Number(startWeek) || 1;
  if (weeklyOverridesInput !== undefined && weeklyOverridesInput !== null) {
    // Merge with existing, validate on merged, then filter to range and save
    const existingPlain = existingModule.weeklyOverrides instanceof Map
      ? Object.fromEntries(existingModule.weeklyOverrides)
      : (existingModule.weeklyOverrides || {});
    const incomingPlain = weeklyOverridesInput instanceof Map
      ? Object.fromEntries(weeklyOverridesInput)
      : weeklyOverridesInput;
    const merged = { ...existingPlain };
    Object.entries(incomingPlain).forEach(([k, v]) => {
      const num = Number(v);
      if (!Number.isNaN(num) && num >= 0) {
        merged[String(k)] = num;
      } else if (v === "" || v === null || v === undefined) {
        merged[String(k)] = 0;
      }
    });
    const duration = durationWeeks !== undefined ? Number(durationWeeks) : existingModule.durationWeeks;
    const start = startWeek !== undefined ? Number(startWeek) : existingModule.startWeek ?? 1;
    const filtered = filterWeeklyOverridesToRange(merged, start, duration);
    updateData.weeklyOverrides = new Map(Object.entries(filtered));
  }
  updateData.updatedBy = req.userAuth._id;

  const module = await ModuleModel.findOneAndUpdate(
    { _id: req.params.id },
    updateData,
    { new: true },
  )
    .populate("program", "name code")
    .populate("teachers", "name email teacherId");

  if (!module) {
    return res.status(404).json({
      status: "failed",
      messageKey: "module.not_found",
      message: "Module not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Module updated successfully",
    data: module,
  });
});

//@desc Delete module
//@route DELETE /api/v1/modules/:id
//@access Private Admin

exports.deleteModule = AsyncHandler(async (req, res) => {
  const ModuleModel = req.tenantModels?.Module || Module;
  const ProgramModel = req.tenantModels?.Program || Program;
  const module = await ModuleModel.findById(req.params.id);
  if (!module) {
    return res.status(404).json({
      status: "failed",
      messageKey: "module.not_found",
      message: "Module not found",
    });
  }

  await ModuleModel.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (module.program) {
    await ProgramModel.findByIdAndUpdate(module.program, {
      $pull: { modules: module._id },
    });
  }

  res.status(200).json({
    status: "success",
    message: "Module deleted successfully",
  });
});
