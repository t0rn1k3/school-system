/**
 * Database-per-tenant: each school gets its own MongoDB database.
 * Registry (lms): AdminLogin, TeacherLogin - routing only (email → schoolDbName).
 * School DBs (lms_school_<id>): Admin, Program, Teacher, Student, etc. - full school data.
 */

const mongoose = require("mongoose");

const tenantConnections = new Map();
const modelSchemas = new Map();

function registerModelSchemas() {
  if (modelSchemas.size > 0) return;
  const Admin = require("../model/Staff/Admin");
  const Program = require("../model/Academic/Program");
  const Teacher = require("../model/Staff/Teacher");
  const Student = require("../model/Academic/Student");
  const Module = require("../model/Academic/Module");
  const Exam = require("../model/Academic/Exam");
  const ExamResult = require("../model/Academic/ExamResults"); // model name: ExamResult
  const AcademicYear = require("../model/Academic/AcademicYear");
  const AcademicTerm = require("../model/Academic/AcademicTerm");
  const YearGroup = require("../model/Academic/YearGroup");
  const Subject = require("../model/Academic/Subject");
  const Question = require("../model/Academic/Question");
  const ClassLevel = require("../model/Academic/ClassLever"); // file typo; model: ClassLevel

  modelSchemas.set("Admin", Admin.schema);
  modelSchemas.set("Program", Program.schema);
  modelSchemas.set("Teacher", Teacher.schema);
  modelSchemas.set("Student", Student.schema);
  modelSchemas.set("Module", Module.schema);
  modelSchemas.set("Exam", Exam.schema);
  modelSchemas.set("ExamResult", ExamResult.schema);
  modelSchemas.set("AcademicYear", AcademicYear.schema);
  modelSchemas.set("AcademicTerm", AcademicTerm.schema);
  modelSchemas.set("YearGroup", YearGroup.schema);
  modelSchemas.set("Subject", Subject.schema);
  modelSchemas.set("Question", Question.schema);
  modelSchemas.set("ClassLevel", ClassLevel.schema);
}

/**
 * Get a connection for a tenant database. Caches connections and registers models.
 * @param {string} dbName - e.g. "lms_school_507f1f77bcf86cd799439011"
 * @returns {mongoose.Connection} Tenant connection, or null if dbName is falsy
 */
function getTenantConnection(dbName) {
  if (!dbName || typeof dbName !== "string") return null;

  if (tenantConnections.has(dbName)) {
    return tenantConnections.get(dbName);
  }

  const conn = mongoose.connection.useDb(dbName);
  registerModelSchemas();

  for (const [name, schema] of modelSchemas) {
    if (!conn.models[name]) {
      conn.model(name, schema);
    }
  }

  tenantConnections.set(dbName, conn);
  return conn;
}

/**
 * Get tenant-scoped models for a database name.
 * @param {string} dbName - Tenant database name
 * @returns {Object} { Program, Teacher, Student, Module, Exam, ... }
 */
function getTenantModels(dbName) {
  const conn = getTenantConnection(dbName);
  if (!conn) return null;
  const models = {};
  for (const name of modelSchemas.keys()) {
    models[name] = conn.model(name);
  }
  return models;
}

/**
 * Bootstrap a new school database (creates DB on first write).
 * @param {string} dbName - Tenant database name (e.g. lms_school_xxx)
 */
async function bootstrapSchoolDatabase(dbName) {
  const conn = getTenantConnection(dbName);
  if (!conn) throw new Error("Invalid dbName for school bootstrap");

  await conn.db.collection("_school").insertOne({
    createdAt: new Date(),
    version: 1,
  });
}

module.exports = {
  getTenantConnection,
  getTenantModels,
  bootstrapSchoolDatabase,
};
