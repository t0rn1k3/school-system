const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const Program = require("../../model/Academic/Program");

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

  const { name, description } = req.body;

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

  const { name, description, duration } = req.body;

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

  res.status(200).json({
    status: "success",
    message: "Program deleted successfully",
  });
});
