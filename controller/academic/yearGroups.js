const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const AcademicYear = require("../../model/Academic/AcademicYear");
const YearGroup = require("../../model/Academic/YearGroup");

//@desc Create year group
//@route POST /api/v1/year-groups
//@access Private

exports.createYearGroup = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, academicYear } = req.body;

  // Validate required fields
  if (!name || !academicYear) {
    return res.status(400).json({
      status: "failed",
      message: "Name and academicYear are required fields",
    });
  }

  // Check if name already exists (ignore soft-deleted records)
  const yearGroupFound = await YearGroup.findOne({
    name,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  if (yearGroupFound) {
    return res.status(409).json({
      status: "failed",
      message: "Year group name already exists",
    });
  }

  //find the academic year
  const academicYearFound = await AcademicYear.findOne({
    _id: academicYear,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  if (!academicYearFound) {
    return res.status(404).json({
      status: "failed",
      message: "Academic year not found",
    });
  }
  //create year group
  const yearGroupCreated = await YearGroup.create({
    name,
    createdBy: req.userAuth._id,
    academicYear,
  });

  //push to the academic year
  academicYearFound.yearGroups.push(yearGroupCreated._id);
  academicYearFound.save();

  //find the admin
  const admin = await Admin.findById(req.userAuth._id);
  admin.yearGroups.push(yearGroupCreated._id);
  admin.save();

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
  // Only fetch non-deleted year groups (handle documents without isDeleted field)
  const yearGroups = await YearGroup.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
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
  const yearGroup = await YearGroup.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group fetched successfully",
    data: yearGroup,
  });
});

//@desc Update program
//@route PUT /api/v1/year-groups/:id
//@access Private

exports.updateYearGroup = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, academicYear } = req.body;

  // Check if name already exists (ignore soft-deleted records and current record)
  if (name) {
    const createdYearGroupFound = await YearGroup.findOne({
      name,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
      _id: { $ne: req.params.id }, // Exclude current year group
    });
    if (createdYearGroupFound) {
      return res.status(409).json({
        status: "failed",
        message: "Year group name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (academicYear !== undefined) updateData.academicYear = academicYear;
  updateData.updatedBy = req.userAuth._id;

  const yearGroup = await YearGroup.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
    },
    updateData,
    {
      new: true,
    },
  );

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group updated successfully",
    data: yearGroup,
  });
});

//@desc Delete program
//@route DELETE /api/v1/year-groups/:id
//@access Private

exports.deleteYearGroup = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const yearGroup = await YearGroup.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!yearGroup) {
    return res.status(404).json({
      status: "failed",
      message: "Year group not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Year group deleted successfully",
  });
});
