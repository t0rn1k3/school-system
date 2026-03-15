const AsyncHandler = require("express-async-handler");
const getModel = require("../../utils/getModel");

//@desc Create subject
//@route POST /api/v1/subjects/:programId
//@access Private

exports.createSubject = AsyncHandler(async (req, res) => {
  const Program = getModel(req, "Program");
  const Subject = getModel(req, "Subject");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "subject.body_required",
      message: "Request body is required",
    });
  }

  const { name, description } = req.body;

  const programFound = await Program.findById(req.params.programId);
  if (!programFound) {
    return res.status(404).json({
      status: "failed",
      messageKey: "subject.program_not_found",
      message: "Program not found",
    });
  }

  const subjectFound = await Subject.findOne({ name });
  if (subjectFound) {
    return res.status(409).json({
      status: "failed",
      messageKey: "subject.already_exists",
      message: "Subject already exists",
    });
  }

  const subjectCreated = await Subject.create({
    name,
    description,
    createdBy: req.userAuth._id,
  });

  programFound.subjects.push(subjectCreated._id);
  await programFound.save();

  res.status(201).json({
    status: "success",
    message: "Subject created successfully",
    data: subjectCreated,
  });
});

//@desc Get all subjects
//@route GET /api/v1/subjects
//@access Private
exports.getSubjects = AsyncHandler(async (req, res) => {
  const Subject = getModel(req, "Subject");
  const subjects = await Subject.find({
    isDeleted: { $ne: true },
  })
    .select("name description")
    .lean();
  res.status(200).json({
    status: "success",
    message: "Subjects fetched successfully",
    data: subjects,
  });
});

//@desc Get single subject
//@route GET /api/v1/subjects/:id
//@access Private

exports.getSubject = AsyncHandler(async (req, res) => {
  const Subject = getModel(req, "Subject");
  const subject = await Subject.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).lean();

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      messageKey: "subject.not_found",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject fetched successfully",
    data: subject,
  });
});

//@desc Update subject
//@route PUT /api/v1/subjects/:id
//@access Private

exports.updateSubject = AsyncHandler(async (req, res) => {
  const Subject = getModel(req, "Subject");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      messageKey: "subject.body_required",
      message: "Request body is required",
    });
  }

  const { name, description } = req.body;

  if (name) {
    const createdSubjectFound = await Subject.findOne({
      name,
      isDeleted: { $ne: true },
      _id: { $ne: req.params.id },
    });
    if (createdSubjectFound) {
      return res.status(409).json({
        status: "failed",
        messageKey: "subject.name_exists",
        message: "Subject name already exists",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  updateData.updatedBy = req.userAuth._id;

  const subject = await Subject.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    updateData,
    { new: true },
  );

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      messageKey: "subject.not_found",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject updated successfully",
    data: subject,
  });
});

//@desc Delete subject
//@route DELETE /api/v1/subjects/:id
//@access Private

exports.deleteSubject = AsyncHandler(async (req, res) => {
  const Subject = getModel(req, "Subject");
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
    { new: true },
  );

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      messageKey: "subject.not_found",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject deleted successfully",
  });
});
