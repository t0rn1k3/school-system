const AsyncHandler = require("express-async-handler");
const Module = require("../../model/Academic/Module");
const Program = require("../../model/Academic/Program");
const {
  distributeHoursEvenly,
  validateWeeklyOverrides,
} = require("../../utils/curriculumUtils");

//@desc Create module
//@route POST /api/v1/modules
//@access Private Admin

exports.createModule = AsyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const {
    name,
    description,
    program,
    criteria,
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
      message: "Name, description, and program are required",
    });
  }

  const programFound = await Program.findOne({
    _id: program,
    isDeleted: { $ne: true },
  });
  if (!programFound) {
    return res.status(404).json({
      status: "failed",
      message: "Program not found",
    });
  }

  const moduleNameExists = await Module.findOne({
    name,
    program,
    isDeleted: { $ne: true },
  });
  if (moduleNameExists) {
    return res.status(409).json({
      status: "failed",
      message: "Module name already exists in this program",
    });
  }

  const normalizedCriteria = Array.isArray(criteria)
    ? criteria.map((c, i) => ({
        id: c.id || `c${i + 1}`,
        name: c.name || "",
        description: c.description || "",
      }))
    : [];

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
        message: validation.message,
      });
    }
    Object.entries(plain).forEach(([k, v]) => {
      weeklyOverridesMap.set(String(k), Number(v) || 0);
    });
  } else if (contact + assessment > 0 && weeks > 0) {
    const dist = distributeHoursEvenly(contact + assessment, weeks, start);
    Object.entries(dist).forEach(([k, v]) => {
      weeklyOverridesMap.set(String(k), v);
    });
  }

  const validTypes = ["professional", "commonProfessional", "general", "integratedGeneral"];
  const moduleType = validTypes.includes(type) ? type : "professional";

  const moduleCreated = await Module.create({
    name,
    description,
    program,
    criteria: normalizedCriteria,
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

  const populated = await Module.findById(moduleCreated._id)
    .populate("program", "name code")
    .populate("teachers", "name email teacherId");

  res.status(201).json({
    status: "success",
    message: "Module created successfully",
    data: populated,
  });
});

//@desc Get all modules
//@route GET /api/v1/modules (optional query: ?program=id)
//@access Private

exports.getModules = AsyncHandler(async (req, res) => {
  const filter = { isDeleted: { $ne: true } };
  if (req.query.program) {
    filter.program = req.query.program;
  }
  if (req.query.teacher) {
    filter.teachers = req.query.teacher;
  }

  const modules = await Module.find(filter)
    .populate("program", "name code")
    .populate("teachers", "name email teacherId")
    .sort({ order: 1, createdAt: 1 });

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
  const module = await Module.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .populate("program", "name code durationWeeks")
    .populate("teachers", "name email teacherId");

  if (!module) {
    return res.status(404).json({
      status: "failed",
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
      message: "Request body is required",
    });
  }

  const {
    name,
    description,
    criteria,
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

  const existingModule = await Module.findById(req.params.id);
  if (!existingModule) {
    return res.status(404).json({
      status: "failed",
      message: "Module not found",
    });
  }

  if (name) {
    const moduleFound = await Module.findOne({
      name,
      program: existingModule.program,
      isDeleted: { $ne: true },
      _id: { $ne: req.params.id },
    });
    if (moduleFound) {
      return res.status(409).json({
        status: "failed",
        message: "Module name already exists in this program",
      });
    }
  }

  if (weeklyOverridesInput !== undefined && weeklyOverridesInput !== null) {
    const moduleForValidation = {
      ...existingModule.toObject(),
      contactHours: contactHours !== undefined ? Number(contactHours) : existingModule.contactHours,
      assessmentHours: assessmentHours !== undefined ? Number(assessmentHours) : existingModule.assessmentHours,
      durationWeeks: durationWeeks !== undefined ? Number(durationWeeks) : existingModule.durationWeeks,
      startWeek: startWeek !== undefined ? Number(startWeek) : existingModule.startWeek,
      weeklyOverrides:
        weeklyOverridesInput instanceof Map
          ? Object.fromEntries(weeklyOverridesInput)
          : weeklyOverridesInput,
    };
    const validation = validateWeeklyOverrides(moduleForValidation);
    if (!validation.valid) {
      return res.status(400).json({
        status: "failed",
        message: validation.message,
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (order !== undefined && Number.isFinite(Number(order)))
    updateData.order = Number(order);
  if (criteria !== undefined && Array.isArray(criteria)) {
    updateData.criteria = criteria.map((c, i) => ({
      id: c.id || `c${i + 1}`,
      name: c.name || "",
      description: c.description || "",
    }));
  }
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
    const map = new Map();
    const plain =
      weeklyOverridesInput instanceof Map
        ? Object.fromEntries(weeklyOverridesInput)
        : weeklyOverridesInput;
    Object.entries(plain).forEach(([k, v]) => {
      map.set(String(k), Number(v) || 0);
    });
    updateData.weeklyOverrides = map;
  }
  updateData.updatedBy = req.userAuth._id;

  const module = await Module.findOneAndUpdate(
    { _id: req.params.id },
    updateData,
    { new: true },
  )
    .populate("program", "name code")
    .populate("teachers", "name email teacherId");

  if (!module) {
    return res.status(404).json({
      status: "failed",
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
  const module = await Module.findById(req.params.id);
  if (!module) {
    return res.status(404).json({
      status: "failed",
      message: "Module not found",
    });
  }

  await Module.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (module.program) {
    await Program.findByIdAndUpdate(module.program, {
      $pull: { modules: module._id },
    });
  }

  res.status(200).json({
    status: "success",
    message: "Module deleted successfully",
  });
});
