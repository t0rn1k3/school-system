const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const Program = require("../../model/Academic/Program");
const Subject = require("../../model/Academic/Subject");

//@desc Create subject
//@route POST /api/v1/subjects/:programId
//@access Private

exports.createSubject = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, academicTerm } = req.body;

  // Check if name already exists
  const programFound = await Program.findById(req.params.programId);
  if (!programFound) {
    return res.status(404).json({
      status: "failed",
      message: "Program not found",
    });
  }

  const subjectFound = await Subject.findOne({ name });
  if (subjectFound) {
    return res.status(409).json({
      status: "failed",
      message: "Subject already exists",
    });
  }
  //create program
  const subjectCreated = await Subject.create({
    name,
    description,
    academicTerm,
    createdBy: req.userAuth._id,
  });

  // push the program to the subject
  programFound.subjects.push(subjectCreated._id);
  //save the program
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
  // Only fetch non-deleted subjects (handle documents without isDeleted field)
  const subjects = await Subject.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
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
  const subject = await Subject.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject fetched successfully",
    data: subject,
  });
});

//@desc Update program
//@route PUT /api/v1/subjects/:id
//@access Private

exports.updateSubject = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, academicTerm } = req.body;

  // Check if name already exists (ignore soft-deleted records and current record)
  if (name) {
    const createdSubjectFound = await Subject.findOne({
      name,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
      _id: { $ne: req.params.id }, // Exclude current subject
    });
    if (createdSubjectFound) {
      return res.status(409).json({
        status: "failed",
        message: "Subject name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (academicTerm !== undefined) updateData.academicTerm = academicTerm;
  updateData.updatedBy = req.userAuth._id;

  const subject = await Subject.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
    },
    updateData,
    {
      new: true,
    },
  );

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject updated successfully",
    data: subject,
  });
});

//@desc Delete program
//@route DELETE /api/v1/subjects/:id
//@access Private

exports.deleteSubject = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!subject) {
    return res.status(404).json({
      status: "failed",
      message: "Subject not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Subject deleted successfully",
  });
});
