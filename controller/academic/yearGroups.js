const AsyncHandler = require("express-async-handler");
const getModel = require("../../utils/getModel");

//@desc Create year group
//@route POST /api/v1/year-groups
//@access Private

exports.createYearGroup = AsyncHandler(async (req, res) => {
  const YearGroup = getModel(req, "YearGroup");
  const AcademicYear = getModel(req, "AcademicYear");
  const Program = getModel(req, "Program");
  const Admin = getModel(req, "Admin");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "year_group.body_required",
      message: "Request body is required",
    });
  }

  const { name, academicYear, program } = req.body;

  if (!name || !academicYear) {
    return res.status(400).json({
      status: "failed",
      messageKey: "year_group.fields_required",
      message: "Name and academicYear are required fields",
    });
  }

  const yearGroupFound = await YearGroup.findOne({
    name,
    isDeleted: { $ne: true },
  });
  if (yearGroupFound) {
    return res.status(409).json({
      status: "failed",
      messageKey: "year_group.name_exists",
      message: "Year group name already exists",
    });
  }

  const academicYearFound = await AcademicYear.findOne({
    _id: academicYear,
    isDeleted: { $ne: true },
  });
  if (!academicYearFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "year_group.academic_year_not_found",
      message: "Academic year not found",
    });
  }

  if (program) {
    const programFound = await Program.findOne({
      _id: program,
      isDeleted: { $ne: true },
    });
    if (!programFound) {
      return res.status(404).json({
        status: "failed",
        messageKey: "year_group.program_not_found",
        message: "Program not found",
      });
    }
  }

  const yearGroupCreated = await YearGroup.create({
    name,
    createdBy: req.userAuth._id,
    academicYear,
    ...(program && { program }),
  });

  academicYearFound.yearGroups.push(yearGroupCreated._id);
  await academicYearFound.save();

  const admin = await Admin.findById(req.userAuth._id);
  if (admin) {
    admin.yearGroups.push(yearGroupCreated._id);
    await admin.save();
  }

  res.status(201).json({
    status: "success",
    message: "Year group created successfully",
    data: yearGroupCreated,
  });
});

//@desc Get all year groups
//@route GET /api/v1/year-groups
//@access Private
exports.getYearGroups = AsyncHandler(async (req, res) => {
  const YearGroup = getModel(req, "YearGroup");
  const yearGroups = await YearGroup.find({
    isDeleted: { $ne: true },
  })
    .populate("program", "name description")
    .populate("academicYear", "name fromYear toYear")
    .lean();
  res.status(200).json({
    status: "success",
    message: "Year groups fetched successfully",
    data: yearGroups,
  });
});

//@desc Get single year group
//@route GET /api/v1/year-groups/:id
//@access Private

exports.getYearGroup = AsyncHandler(async (req, res) => {
  const YearGroup = getModel(req, "YearGroup");
  const yearGroup = await YearGroup.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  })
    .populate("program", "name description")
    .populate("academicYear", "name fromYear toYear")
    .lean();

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      messageKey: "year_group.not_found",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group fetched successfully",
    data: yearGroup,
  });
});

//@desc Update year group
//@route PUT /api/v1/year-groups/:id
//@access Private

exports.updateYearGroup = AsyncHandler(async (req, res) => {
  const YearGroup = getModel(req, "YearGroup");
  const Program = getModel(req, "Program");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "year_group.body_required",
      message: "Request body is required",
    });
  }

  const { name, academicYear, program } = req.body;

  if (name) {
    const createdYearGroupFound = await YearGroup.findOne({
      name,
      isDeleted: { $ne: true },
      _id: { $ne: req.params.id },
    });
    if (createdYearGroupFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "year_group.name_exists",
        message: "Year group name already exists",
      });
    }
  }

  if (program !== undefined && program !== null && program !== "") {
    const programFound = await Program.findOne({
      _id: program,
      isDeleted: { $ne: true },
    });
    if (!programFound) {
      return res.status(404).json({
        status: "failed",
        messageKey: "year_group.program_not_found",
        message: "Program not found",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  if (program !== undefined) updateData.program = program === null || program === "" ? undefined : program;
  updateData.updatedBy = req.userAuth._id;

  const yearGroup = await YearGroup.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: { $ne: true },
    },
    updateData,
    { new: true },
  )
    .populate("program", "name description")
    .populate("academicYear", "name fromYear toYear");

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      messageKey: "year_group.not_found",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group updated successfully",
    data: yearGroup,
  });
});

//@desc Delete year group
//@route DELETE /api/v1/year-groups/:id
//@access Private

exports.deleteYearGroup = AsyncHandler(async (req, res) => {
  const YearGroup = getModel(req, "YearGroup");
  const yearGroup = await YearGroup.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      messageKey: "year_group.not_found",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group deleted successfully",
  });
});
