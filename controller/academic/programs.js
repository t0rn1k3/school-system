const AsyncHandler = require("express-async-handler");
const XLSX = require("xlsx");
const Admin = require("../../model/Staff/Admin");
const Module = require("../../model/Academic/Module");
const Program = require("../../model/Academic/Program");
const {
  getWeekLabels,
  getEffectiveWeeklyHours,
  distributeHoursEvenly,
  validateWeeklyOverrides,
  filterWeeklyOverridesToRange,
} = require("../../utils/curriculumUtils");

//@desc Create program
//@route POST /api/v1/programs
//@access Private

exports.createProgram = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "program.body_required",
      message: "Request body is required",
    });
  }

  const { name, description, duration, durationWeeks, startDate, holidays, classLevels } = req.body;

  // Check if name already exists (ignore soft-deleted records)
  const program = await Program.findOne({
    name,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  if (program) {
    return res.status(409).json({
      status: "failed",
      messageKey: "program.already_exists",
      message: "Program already exists",
    });
  }
  //create program
  const programCreated = await Program.create({
    name,
    description,
    ...(duration && { duration }),
    ...(durationWeeks !== undefined && { durationWeeks }),
    ...(startDate && { startDate: new Date(startDate) }),
    ...(holidays && Array.isArray(holidays) && { holidays }),
    ...(classLevels && Array.isArray(classLevels) && { classLevels }),
    createdBy: req.userAuth._id,
  });

  // push the program to the admin
  const admin = await Admin.findById(req.userAuth._id);
  admin.programs.push(programCreated._id);
  admin.save();
  res.status(201).json({
    status: "success",
    message: "Program created successfully",
    data: programCreated,
  });
});

//@desc Get all programs
//@route GET /api/v1/programs
//@access Private
exports.getPrograms = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted programs (handle documents without isDeleted field)
  const programs = await Program.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  res.status(200).json({
    status: "success",
    message: "Programs fetched successfully",
    data: programs,
  });
});

//@desc Get single program
//@route GET /api/v1/programs/:id
//@access Private

exports.getProgram = AsyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
    populate: { path: "teachers", select: "name email teacherId" },
  });

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Program fetched successfully",
    data: program,
  });
});

//@desc Update program
//@route PUT /api/v1/programs/:id
//@access Private

exports.updateProgram = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "program.body_required",
      message: "Request body is required",
    });
  }

  const { name, description, duration, durationWeeks, startDate, holidays, classLevels } = req.body;

  // Check if name already exists (ignore soft-deleted records and current record)
  if (name) {
    const createdProgramFound = await Program.findOne({
      name,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
      _id: { $ne: req.params.id }, // Exclude current program
    });
    if (createdProgramFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "program.name_exists",
        message: "Program name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (duration !== undefined) updateData.duration = duration;
  if (durationWeeks !== undefined) updateData.durationWeeks = durationWeeks;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (holidays !== undefined && Array.isArray(holidays)) updateData.holidays = holidays;
  if (classLevels !== undefined && Array.isArray(classLevels))
    updateData.classLevels = classLevels;
  updateData.updatedBy = req.userAuth._id;

  const program = await Program.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
    },
    updateData,
    {
      new: true,
    },
  );

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Program updated successfully",
    data: program,
  });
});

//@desc Get program curriculum with resolved weekly hours per module
//@route GET /api/v1/programs/:id/curriculum
//@access Private

exports.getProgramCurriculum = AsyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
    populate: { path: "teachers", select: "name email teacherId" },
    options: { sort: { startWeek: 1, order: 1 } },
  });

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  const totalWeeks = program.durationWeeks || 0;
  const modules = (program.modules || []).map((m) => {
    const mod = m.toObject ? m.toObject() : { ...m };
    mod.effectiveWeeklyHours = getEffectiveWeeklyHours(mod);
    return mod;
  });

  const weekLabels = program.startDate
    ? getWeekLabels(program.startDate, totalWeeks)
    : null;

  res.status(200).json({
    status: "success",
    message: "Curriculum fetched successfully",
    data: {
      program: {
        _id: program._id,
        name: program.name,
        description: program.description,
        durationWeeks: program.durationWeeks,
        startDate: program.startDate,
        holidays: program.holidays || [],
      },
      modules,
      totalWeeks,
      weekLabels,
    },
  });
});

//@desc Update program curriculum (admin only)
//@route PUT /api/v1/programs/:id/curriculum
//@access Private Admin

exports.updateProgramCurriculum = AsyncHandler(async (req, res) => {
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "program.body_required",
      message: "Request body is required",
    });
  }

  const { durationWeeks, startDate, holidays, modules: modulesPayload } = req.body;

  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
  });

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  const updateData = {};
  if (durationWeeks !== undefined) updateData.durationWeeks = Number(durationWeeks) || 0;
  if (startDate !== undefined) updateData.startDate = startDate ? new Date(startDate) : null;
  if (holidays !== undefined && Array.isArray(holidays)) updateData.holidays = holidays;

  if (Object.keys(updateData).length > 0) {
    await Program.findByIdAndUpdate(req.params.id, updateData);
  }

  if (Array.isArray(modulesPayload) && modulesPayload.length > 0) {
    for (const item of modulesPayload) {
      const { moduleId, weeklyOverrides } = item;
      if (!moduleId || !weeklyOverrides || typeof weeklyOverrides !== "object") continue;

      const mod = program.modules.find((m) => String(m._id) === String(moduleId));
      if (!mod) continue;

      const plain = weeklyOverrides instanceof Map ? Object.fromEntries(weeklyOverrides) : weeklyOverrides;
      const existingPlain = mod.weeklyOverrides instanceof Map
        ? Object.fromEntries(mod.weeklyOverrides)
        : (mod.weeklyOverrides || {});
      const merged = { ...existingPlain };
      Object.entries(plain).forEach(([k, v]) => {
        const num = Number(v);
        if (!Number.isNaN(num) && num >= 0) {
          merged[String(k)] = num;
        } else if (v === "" || v === null || v === undefined) {
          merged[String(k)] = 0;
        }
      });

      const moduleForValidation = {
        contactHours: mod.contactHours ?? 0,
        assessmentHours: mod.assessmentHours ?? 0,
        durationWeeks: mod.durationWeeks ?? 0,
        startWeek: mod.startWeek ?? 1,
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

      const filtered = filterWeeklyOverridesToRange(
        merged,
        mod.startWeek ?? 1,
        mod.durationWeeks ?? 0
      );
      const map = new Map(Object.entries(filtered));
      await Module.findByIdAndUpdate(moduleId, {
        weeklyOverrides: map,
        updatedBy: req.userAuth._id,
      });
    }
  }

  const updatedProgram = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
    populate: { path: "teachers", select: "name email teacherId" },
    options: { sort: { startWeek: 1, order: 1 } },
  });

  const totalWeeks = updatedProgram.durationWeeks || 0;
  const modules = (updatedProgram.modules || []).map((m) => {
    const mod = m.toObject ? m.toObject() : { ...m };
    mod.effectiveWeeklyHours = getEffectiveWeeklyHours(mod);
    return mod;
  });

  const weekLabels = updatedProgram.startDate
    ? getWeekLabels(updatedProgram.startDate, totalWeeks)
    : null;

  res.status(200).json({
    status: "success",
    message: "Curriculum updated successfully",
    data: {
      program: {
        _id: updatedProgram._id,
        name: updatedProgram.name,
        description: updatedProgram.description,
        durationWeeks: updatedProgram.durationWeeks,
        startDate: updatedProgram.startDate,
        holidays: updatedProgram.holidays || [],
      },
      modules,
      totalWeeks,
      weekLabels,
    },
  });
});

//@desc Reset program curriculum - clear weekly overrides from all modules (admin only)
//@route DELETE /api/v1/programs/:id/curriculum
//@access Private Admin

exports.resetProgramCurriculum = AsyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
  });

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  for (const mod of program.modules || []) {
    const contact = Number(mod.contactHours) || 0;
    const assessment = Number(mod.assessmentHours) || 0;
    const weeks = Number(mod.durationWeeks) || 0;
    const start = mod.startWeek != null ? Number(mod.startWeek) : 1;

    if (weeks > 0 && contact + assessment > 0) {
      const dist = distributeHoursEvenly(contact + assessment, weeks, start);
      const map = new Map(Object.entries(dist));
      await Module.findByIdAndUpdate(mod._id, {
        weeklyOverrides: map,
        updatedBy: req.userAuth._id,
      });
    } else {
      await Module.findByIdAndUpdate(mod._id, {
        weeklyOverrides: new Map(),
        updatedBy: req.userAuth._id,
      });
    }
  }

  const updatedProgram = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
    populate: { path: "teachers", select: "name email teacherId" },
    options: { sort: { startWeek: 1, order: 1 } },
  });

  const totalWeeks = updatedProgram.durationWeeks || 0;
  const modules = (updatedProgram.modules || []).map((m) => {
    const mod = m.toObject ? m.toObject() : { ...m };
    mod.effectiveWeeklyHours = getEffectiveWeeklyHours(mod);
    return mod;
  });

  const weekLabels = updatedProgram.startDate
    ? getWeekLabels(updatedProgram.startDate, totalWeeks)
    : null;

  res.status(200).json({
    status: "success",
    message: "Curriculum reset successfully",
    data: {
      program: {
        _id: updatedProgram._id,
        name: updatedProgram.name,
        description: updatedProgram.description,
        durationWeeks: updatedProgram.durationWeeks,
        startDate: updatedProgram.startDate,
        holidays: updatedProgram.holidays || [],
      },
      modules,
      totalWeeks,
      weekLabels,
    },
  });
});

//@desc Download curriculum as XLS file
//@route GET /api/v1/programs/:id/curriculum/download
//@access Private (Teacher or Admin)

exports.downloadCurriculumXls = AsyncHandler(async (req, res) => {
  const program = await Program.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).populate({
    path: "modules",
    match: { isDeleted: { $ne: true } },
    populate: { path: "teachers", select: "name email teacherId" },
    options: { sort: { startWeek: 1, order: 1 } },
  });

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  const totalWeeks = program.durationWeeks || 0;
  const weekLabels = program.startDate
    ? getWeekLabels(program.startDate, totalWeeks)
    : Array.from({ length: totalWeeks }, (_, i) => `W${i + 1}`);

  const modules = (program.modules || []).map((m) => {
    const mod = m.toObject ? m.toObject() : { ...m };
    mod.effectiveWeeklyHours = getEffectiveWeeklyHours(mod);
    return mod;
  });

  // Build header row: Code, Name, Type, Total, Contact Hrs, Independent Hrs, Assessment Hrs, Duration Weeks, Credits, W1...Wn
  const headerRow = [
    "Code",
    "Name",
    "Type",
    "Total",
    "Contact Hrs",
    "Independent Hrs",
    "Assessment Hrs",
    "Duration Weeks",
    "Credits",
  ];
  for (let w = 1; w <= totalWeeks; w++) {
    headerRow.push(weekLabels[w - 1] || `W${w}`);
  }

  const data = [headerRow];

  for (const mod of modules) {
    const contact = Number(mod.contactHours) || 0;
    const independent = Number(mod.independentHours) || 0;
    const assessment = Number(mod.assessmentHours) || 0;
    const total = contact + independent + assessment;
    const row = [
      mod.code ?? "",
      mod.name ?? "",
      mod.type ?? "",
      total,
      contact,
      independent,
      assessment,
      mod.durationWeeks ?? 0,
      mod.credits ?? 0,
    ];
    const hours = mod.effectiveWeeklyHours || {};
    for (let w = 1; w <= totalWeeks; w++) {
      const key = String(w);
      row.push(hours[key] ?? "");
    }
    data.push(row);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);
  const wb = XLSX.utils.book_new();
  const sheetName = "Curriculum";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const programName = (program.name || "Curriculum").replace(/[\\/*?:\[\]]/g, "-");
  const fileName = `${programName}_curriculum.xlsx`;

  res.setHeader(
    "Content-Disposition",
    `attachment; filename="${encodeURIComponent(fileName)}"`
  );
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  res.send(buffer);
});

//@desc Delete program
//@route DELETE /api/v1/programs/:id
//@access Private

exports.deleteProgram = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const program = await Program.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!program) {
    return res.status(404).json({
      status: "failed",
      messageKey: "program.not_found",
      message: "Program not found",
    });
  }

  // Remove program from all admins' programs array so it no longer appears in profile
  await Admin.updateMany(
    { programs: req.params.id },
    { $pull: { programs: req.params.id } },
  );

  res.status(200).json({
    status: "success",
    message: "Program deleted successfully",
  });
});
