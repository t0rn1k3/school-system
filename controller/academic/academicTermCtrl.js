const AsyncHandler = require("express-async-handler");
const getModel = require("../../utils/getModel");

//@desc Create academic term
//@route POST /api/v1/academic-terms
//@access Private

exports.createAcademicTerm = AsyncHandler(async (req, res) => {
  const AcademicTerm = getModel(req, "AcademicTerm");
  const Admin = getModel(req, "Admin");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "academic_term.body_required",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  const academicTerm = await AcademicTerm.findOne({ name, isDeleted: false });
  if (academicTerm) {
    return res.status(409).json({
      status: "failed",
      messageKey: "academic_term.already_exists",
      message: "Academic term already exists",
    });
  }

  const academicTermCreated = await AcademicTerm.create({
    name,
    description,
    duration,
    createdBy: req.userAuth._id,
  });

  const admin = await Admin.findById(req.userAuth._id);
  if (admin) {
    admin.academicTerms.push(academicTermCreated._id);
    await admin.save();
  }
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
  const AcademicTerm = getModel(req, "AcademicTerm");
  const academicTerms = await AcademicTerm.find({ isDeleted: false })
    .select("name description duration")
    .lean();
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
  const AcademicTerm = getModel(req, "AcademicTerm");
  const academicTerm = await AcademicTerm.findOne({
    _id: req.params.id,
    isDeleted: false,
  }).lean();

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_term.not_found",
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
  const AcademicTerm = getModel(req, "AcademicTerm");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "academic_term.body_required",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  if (name) {
    const createdAcademicTermFound = await AcademicTerm.findOne({
      name,
      isDeleted: false,
      _id: { $ne: req.params.id },
    });
    if (createdAcademicTermFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "academic_term.name_exists",
        message: "Academic term name already exists",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (duration !== undefined) updateData.duration = duration;
  updateData.updatedBy = req.userAuth._id;

  const academicTerm = await AcademicTerm.findOneAndUpdate(
    { _id: req.params.id, isDeleted: false },
    updateData,
    { new: true },
  );

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_term.not_found",
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
  const AcademicTerm = getModel(req, "AcademicTerm");
  const academicTerm = await AcademicTerm.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (!academicTerm) {
    return res.status(404).json({
      status: "failed",
      messageKey: "academic_term.not_found",
      message: "Academic term not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Academic term deleted successfully",
  });
});
