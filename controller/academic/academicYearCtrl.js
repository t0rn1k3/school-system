const AsyncHandler = require("express-async-handler");
const getModel = require("../../utils/getModel");

//@desc Create academic year
//@route POST /api/v1/academic-years
//@access Private

exports.createAcademicYear = AsyncHandler(async (req, res) => {
  const AcademicYear = getModel(req, "AcademicYear");
  const Admin = getModel(req, "Admin");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "academic_year.body_required",
      message: "Request body is required",
    });
  }

  const { name, fromYear, toYear } = req.body;

  if (!name || !fromYear || !toYear) {
    return res.status(400).json({
      status: "failed",
      messageKey: "academic_year.fields_required",
      message: "Name, fromYear, and toYear are required fields",
    });
  }

  const academicYear = await AcademicYear.findOne({ name, isDeleted: false });
  if (academicYear) {
    return res.status(409).json({
      status: "failed",
      messageKey: "academic_year.already_exists",
      message: "Academic year already exists",
    });
  }

  const academicYearCreated = await AcademicYear.create({
    name,
    fromYear,
    toYear,
    createdBy: req.userAuth._id,
  });

  const admin = await Admin.findById(req.userAuth._id);
  if (admin) {
    admin.academicYears.push(academicYearCreated._id);
    await admin.save();
  }
  res.status(201).json({
    status: "success",
    message: "Academic year created successfully",
    data: academicYearCreated,
  });
});

//@desc Get all academic years
//@route GET /api/v1/academic-years
//@access Private
exports.getAcademicYears = AsyncHandler(async (req, res) => {
  const AcademicYear = getModel(req, "AcademicYear");
  const academicYears = await AcademicYear.find({ isDeleted: false })
    .select("name fromYear toYear isCurrent")
    .lean();
  res.status(200).json({
    status: "success",
    message: "Academic years fetched successfully",
    data: academicYears,
  });
});

//@desc Get single academic year
//@route GET /api/v1/academic-years/:id
//@access Private

exports.getAcademicYear = AsyncHandler(async (req, res) => {
  const AcademicYear = getModel(req, "AcademicYear");
  const academiYear = await AcademicYear.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).lean();

  if (!academiYear) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_year.not_found",
      message: "Academic year not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic year fetched successfully",
    data: academiYear,
  });
});

//@desc Update academic year
//@route PUT /api/v1/academic-years/:id
//@access Private

exports.updateAcademicYear = AsyncHandler(async (req, res) => {
  const AcademicYear = getModel(req, "AcademicYear");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "academic_year.body_required",
      message: "Request body is required",
    });
  }

  const { name, fromYear, toYear } = req.body;

  if (name) {
    const createdAcademicYearFound = await AcademicYear.findOne({
      name,
      isDeleted: false,
      _id: { $ne: req.params.id },
    });
    if (createdAcademicYearFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "academic_year.name_exists",
        message: "Academic year name already exists",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (fromYear !== undefined) updateData.fromYear = fromYear;
  if (toYear !== undefined) updateData.toYear = toYear;
  updateData.updatedBy = req.userAuth._id;

  const academicYear = await AcademicYear.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updateData,
    { new: true },
  );

  if (!academicYear) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_year.not_found",
      message: "Academic year not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic year updated successfully",
    data: academicYear,
  });
});

//@desc Delete academic year
//@route DELETE /api/v1/academic-years/:id
//@access Private

exports.deleteAcademicYear = AsyncHandler(async (req, res) => {
  const AcademicYear = getModel(req, "AcademicYear");
  const academicYear = await AcademicYear.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (!academicYear) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_year.not_found",
      message: "Academic year not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic year deleted successfully",
  });
});
