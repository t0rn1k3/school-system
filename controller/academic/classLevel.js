const AsyncHandler = require("express-async-handler");
const Admin = require("../../model/Staff/Admin");
const ClassLevel = require("../../model/Academic/ClassLever");

//@desc Create class level
//@route POST /api/v1/class-levels
//@access Private

exports.createClassLevel = AsyncHandler(async (req, res) => {
  // Validate request body exists
  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  // Check if name already exists (ignore soft-deleted records)
  const classLevel = await ClassLevel.findOne({
    name,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  if (classLevel) {
    return res.status(409).json({
      status: "failed",
      message: "Class level already exists",
    });
  }
  //create class level
  const classLevelCreated = await ClassLevel.create({
    name,
    description,
    duration,
    createdBy: req.userAuth._id,
  });

  // push the class level to the admin
  const admin = await Admin.findById(req.userAuth._id);
  admin.classLevels.push(classLevelCreated._id);
  admin.save();
  res.status(201).json({
    status: "success",
    message: "Class level created successfully",
    data: classLevelCreated,
  });
});

//@desc Get all class levels
//@route GET /api/v1/class-levels
//@access Private
exports.getClassLevels = AsyncHandler(async (req, res) => {
  // Only fetch non-deleted class levels (handle documents without isDeleted field)
  const classLevels = await ClassLevel.find({
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });
  res.status(200).json({
    status: "success",
    message: "Class levels fetched successfully",
    data: classLevels,
  });
});

//@desc Get single class level
//@route GET /api/v1/class-levels/:id
//@access Private

exports.getClassLevel = AsyncHandler(async (req, res) => {
  const classLevel = await ClassLevel.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
  });

  if (!classLevel) {
    return res.status(404).json({
      status: "failed",
      message: "Class level not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Class level fetched successfully",
    data: classLevel,
  });
});

//@desc Update class level
//@route PUT /api/v1/class-levels/:id
//@access Private

exports.updateClassLevel = AsyncHandler(async (req, res) => {
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
    const createdClassLevelFound = await ClassLevel.findOne({
      name,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
      _id: { $ne: req.params.id }, // Exclude current class level
    });
    if (createdClassLevelFound) {
      return res.status(409).json({
        status: "failed",
        message: "Class level name already exists",
      });
    }
  }

  // Build update object with only provided fields
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (duration !== undefined) updateData.duration = duration;
  updateData.updatedBy = req.userAuth._id;

  const classLevel = await ClassLevel.findOneAndUpdate(
    {
      _id: req.params.id,
      isDeleted: { $ne: true }, // Matches false, null, undefined, or doesn't exist
    },
    updateData,
    {
      new: true,
    },
  );

  if (!classLevel) {
    return res.status(404).json({
      status: "failed",
      message: "Class level not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Class level updated successfully",
    data: classLevel,
  });
});

//@desc Delete class level
//@route DELETE /api/v1/class-levels/:id
//@access Private

exports.deleteClassLevel = AsyncHandler(async (req, res) => {
  // Soft delete: Set isDeleted to true instead of hard delete
  const classLevel = await ClassLevel.findByIdAndUpdate(
    req.params.id,
    {
      isDeleted: true,
    },
    { new: true },
  );

  if (!classLevel) {
    return res.status(404).json({
      status: "failed",
      message: "Class level not found",
    });
  }

  res.status(200).json({
    status: "success",
    message: "Class level deleted successfully",
  });
});
