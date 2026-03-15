const AsyncHandler = require("express-async-handler");
const getModel = require("../../utils/getModel");

//@desc Create class level
//@route POST /api/v1/class-levels
//@access Private

exports.createClassLevel = AsyncHandler(async (req, res) => {
  const ClassLevel = getModel(req, "ClassLevel");
  const Admin = getModel(req, "Admin");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  const classLevel = await ClassLevel.findOne({
    name,
    isDeleted: { $ne: true },
  });
  if (classLevel) {
    return res.status(409).json({
      status: "failed",
      message: "Class level already exists",
    });
  }

  const classLevelCreated = await ClassLevel.create({
    name,
    description,
    duration,
    createdBy: req.userAuth._id,
  });

  const admin = await Admin.findById(req.userAuth._id);
  if (admin) {
    admin.classLevels.push(classLevelCreated._id);
    await admin.save();
  }
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
  const ClassLevel = getModel(req, "ClassLevel");
  const classLevels = await ClassLevel.find({
    isDeleted: { $ne: true },
  })
    .select("name order description")
    .lean();
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
  const ClassLevel = getModel(req, "ClassLevel");
  const classLevel = await ClassLevel.findOne({
    _id: req.params.id,
    isDeleted: { $ne: true },
  }).lean();

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
  const ClassLevel = getModel(req, "ClassLevel");

  if (!req.body || typeof req.body !== "object") {
    return res.status(400).json({
      status: "failed",
      message: "Request body is required",
    });
  }

  const { name, description, duration } = req.body;

  if (name) {
    const createdClassLevelFound = await ClassLevel.findOne({
      name,
      isDeleted: { $ne: true },
      _id: { $ne: req.params.id },
    });
    if (createdClassLevelFound) {
      return res.status(409).json({
        status: "failed",
        message: "Class level name already exists",
      });
    }
  }

  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (description !== undefined) updateData.description = description;
  if (duration !== undefined) updateData.duration = duration;
  updateData.updatedBy = req.userAuth._id;

  const classLevel = await ClassLevel.findOneAndUpdate(
    { _id: req.params.id, isDeleted: { $ne: true } },
    updateData,
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
    message: "Class level updated successfully",
    data: classLevel,
  });
});

//@desc Delete class level
//@route DELETE /api/v1/class-levels/:id
//@access Private

exports.deleteClassLevel = AsyncHandler(async (req, res) => {
  const ClassLevel = getModel(req, "ClassLevel");
  const classLevel = await ClassLevel.findByIdAndUpdate(
    req.params.id,
    { isDeleted: true },
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
