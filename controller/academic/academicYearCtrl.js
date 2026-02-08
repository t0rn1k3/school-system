const AsyncHandler = require("express-async-handler");
const AcademicYear = require("../../model/Academic/AcademicYear");
const Admin = require("../../model/Staff/Admin");

//@desc Create academic year
//@route POST /api/v1/academic-years
//@access Private

exports.createAcademicYear = AsyncHandler(async (req, res) => {
  const { name, fromYear, toYear, isCurrent } = req.body;
  const academicYear = await AcademicYear.findOne({ name });
  if (academicYear) {
    throw new Error("Academic year already exists");
  }
  //create academic year
  const academicYearCreated = await AcademicYear.create({
    name,
    fromYear,
    toYear,
    createdBy: req.userAuth._id,
  });
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
  const academicYears = await AcademicYear.find();
  res.status(201).json({
    status: "success",
    message: "Academic years fetched successfully",
    data: academicYears,
  });
});

//@desc Get single academic year
//@route GET /api/v1/academic-years/:id
//@access Private

exports.getAcademicYear = AsyncHandler(async (req, res) => {
  const academiYear = await AcademicYear.findById(req.params.id);

  res.status(201).json({
    status: "success",
    message: "Academic year fetched successfully",
    data: academiYear,
  });
});

//@desc Update academic year
//@route PUT /api/v1/academic-years/:id
//@access Private

exports.updateAcademicYear = AsyncHandler(async (req, res) => {
  const { name, fromYear, toYear } = req.body;
  // check if name is already exists

  const createdAcademicYearFound = await AcademicYear.findOne({ name });
  if (createdAcademicYearFound) {
    throw new Error("Academic year name already exists");
  }
  const academicYear = await AcademicYear.findByIdAndUpdate(
    req.params.id,
    {
      name,
      fromYear,
      toYear,
      updatedBy: req.userAuth._id,
    },
    {
      new: true,
    },
  );

  res.status(201).json({
    status: "success",
    message: "Academic year updated successfully",
    data: academicYear,
  });
});
