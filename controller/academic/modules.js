const AsyncHandler = require("express-async-handler");
const Module = require("../../model/Academic/Module");
const Program = require("../../model/Academic/Program");

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

  const { name, description, program, criteria, order, teachers } = req.body;

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

  const moduleCreated = await Module.create({
    name,
    description,
    program,
    criteria: normalizedCriteria,
    order: typeof order === "number" ? order : 0,
    teachers: teachersArray,
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

  const { name, description, criteria, order, teachers } = req.body;

  const existingModule = await Module.findById(req.params.id).select("program");
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
