const AsyncHandler = require("express-async-handler");
const AcademicYear = require("../../model/Academic/AcademicYear");
const Admin = require("../../model/Staff/Admin");

//@desc Create academic year
//@route POST /api/v1/academic-years
//@access Private

exports.createAcademicYear = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, fromYear, toYear } = req.body;

  // Validate required fields
  if (!name || !fromYear || !toYear) {
    return res.status(400).json({
      status: "failed",
      message: "Name, fromYear, and toYear are required fields",
    });
  }

  // Check if name already exists (ignore soft-deleted records)
  const academicYear = await AcademicYear.findOne({
    name,
    isDeleted: false,
  });
  if (academicYear) {
    return res.status(409).json({
      status: "failed",
      message: "Academic year already exists",
    });
  }
  //create academic year
  const academicYearCreated = await AcademicYear.create({
    name,
    fromYear,
    toYear,
    createdBy: req.userAuth._id,
  });

  // push the academic year to the admin
  const admin = await Admin.findById(req.userAuth._id);
  admin.academicYears.push(academicYearCreated._id);
  admin.save();
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
  // Only fetch non-deleted academic years
  const academicYears = await AcademicYear.find({ isDeleted: false });
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
  const academiYear = await AcademicYear.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!academiYear) {
    return res.status(404).json({
      status: "failed",
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
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, fromYear, toYear } = req.body;

  // Check if name already exists (ignore soft-deleted records and current record)
  if (name) {
    const createdAcademicYearFound = await AcademicYear.findOne({
      name,
      isDeleted: false,
      _id: { $ne: req.params.id }, // Exclude current academic year
    });
    if (createdAcademicYearFound) {
      return res.status(409).json({
        status: "failed",
        message: "Academic year name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (fromYear !== undefined) updateData.fromYear = fromYear;
  if (toYear !== undefined) updateData.toYear = toYear;
  updateData.updatedBy = req.userAuth._id;

  const academicYear = await AcademicYear.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updateData,
    {
      new: true,
    },
  );

  if (!academicYear) {
    return res.status(404).json({
      status: "failed",
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
  // Soft delete: Set isDeleted to true instead of hard delete
  const academicYear = await AcademicYear.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!academicYear) {
    return res.status(404).json({
      status: "failed",
      message: "Academic year not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic year deleted successfully",
  });
});
