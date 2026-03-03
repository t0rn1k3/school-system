const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const Program = require("../../model/Academic/Program");
const { getWeekLabels, getEffectiveWeeklyHours } = require("../../utils/curriculumUtils");

//@desc Create program
//@route POST /api/v1/programs
//@access Private

exports.createProgram = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
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
