/**
 * Returns the correct model for the current request (tenant or default).
 * Use this in controllers to support database-per-tenant.
 * @param {Object} req - Express request (must have req.tenantModels from setTenantModels)
 * @param {string} modelName - e.g. "Program", "Teacher", "Student"
 * @returns {Model} Mongoose model
 */
function getModel(req, modelName) {
  if (req.tenantModels && req.tenantModels[modelName]) {
    return req.tenantModels[modelName];
  }
  const models = {
    Admin: require("../model/Staff/Admin"),
    Program: require("../model/Academic/Program"),
    Teacher: require("../model/Staff/Teacher"),
    Student: require("../model/Academic/Student"),
    Module: require("../model/Academic/Module"),
    Exam: require("../model/Academic/Exam"),
    ExamResult: require("../model/Academic/ExamResults"),
    AcademicYear: require("../model/Academic/AcademicYear"),
    AcademicTerm: require("../model/Academic/AcademicTerm"),
    YearGroup: require("../model/Academic/YearGroup"),
    Subject: require("../model/Academic/Subject"),
    Question: require("../model/Academic/Question"),
    ClassLevel: require("../model/Academic/ClassLever"),
  };
  return models[modelName];
}

module.exports = getModel;
