const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const AcademicTerm = require("../../model/Academic/AcademicTerm");

//@desc Create academic term
//@route POST /api/v1/academic-terms
//@access Private

exports.createAcademicTerm = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  // Check if name already exists (ignore soft-deleted records)
  const academicTerm = await AcademicTerm.findOne({
    name,
    isDeleted: false,
  });
  if (academicTerm) {
    return res.status(409).json({
      status: "failed",
      message: "Academic term already exists",
    });
  }
  //create academic term
  const academicTermCreated = await AcademicTerm.create({
    name,
    description,
    duration,
    createdBy: req.userAuth._id,
  });

  // push the academic term to the admin
  const admin = await Admin.findById(req.userAuth._id);
  admin.academicTerms.push(academicTermCreated._id);
  admin.save();
  res.status(201).json({
    status: "success",
    message: "Academic term created successfully",
    data: academicTermCreated,
  });
});

//@desc Get all academic terms
//@route GET /api/v1/academic-terms
//@access Private
exports.getAcademicTerms = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted academic terms
  const academicTerms = await AcademicTerm.find({ isDeleted: false });
  res.status(200).json({
    status: "success",
    message: "Academic terms fetched successfully",
    data: academicTerms,
  });
});

//@desc Get single academic term
//@route GET /api/v1/academic-terms/:id
//@access Private

exports.getAcademicTerm = AsyncHandler(async (req, res) => {
  const academicTerm = await AcademicTerm.findOne({
    _id: req.params.id,
    isDeleted: false,
  });

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      message: "Academic term not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic term fetched successfully",
    data: academicTerm,
  });
});

//@desc Update academic term
//@route PUT /api/v1/academic-terms/:id
//@access Private

exports.updateAcademicTerm = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  // Check if name already exists (ignore soft-deleted records and current record)
  if (name) {
    const createdAcademicTermFound = await AcademicTerm.findOne({
      name,
      isDeleted: false,
      _id: { $ne: req.params.id }, // Exclude current academic term
    });
    if (createdAcademicTermFound) {
      return res.status(409).json({
        status: "failed",
        message: "Academic term name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (duration !== undefined) updateData.duration = duration;
  updateData.updatedBy = req.userAuth._id;

  const academicTerm = await AcademicTerm.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updateData,
    {
      new: true,
    },
  );

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      message: "Academic term not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic term updated successfully",
    data: academicTerm,
  });
});

//@desc Delete academic term
//@route DELETE /api/v1/academic-terms/:id
//@access Private

exports.deleteAcademicTerm = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const academicTerm = await AcademicTerm.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      message: "Academic term not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic term deleted successfully",
  });
});
