const Student = require("../model/Academic/Student");
const ExamResult = require("../model/Academic/ExamResults");

/**
 * Check if student has passed all modules in their program.
 * If so, set isGraduated = true and yearGraduated = current year.
 * Module is passed if at least one published ExamResult (exam.module = that module) has status "Passed".
 * @param {string} studentId - Student _id
 * @returns {Promise<{ graduated: boolean }>} - whether the student was graduated
 */
async function checkAndGraduateStudent(studentId) {
  const student = await Student.findById(studentId)
    .select("program isGraduated")
    .populate("program", "modules");

  if (!student || !student.program) {
    return { graduated: false };
  }

  const moduleIds = (student.program.modules || []).map((m) =>
    m._id ? m._id.toString() : m.toString(),
  );

  if (moduleIds.length === 0) {
    return { graduated: false };
  }

  const passedResults = await ExamResult.find({
    student: studentId,
    status: "Passed",
    isPublished: true,
  })
    .populate("exam", "module")
    .lean();

  const passedModuleIds = new Set();
  for (const er of passedResults) {
    const moduleId = er.exam?.module?.toString?.() || er.exam?.module;
    if (moduleId && moduleIds.includes(moduleId)) {
      passedModuleIds.add(moduleId);
    }
  }

  const allPassed = moduleIds.every((m) => passedModuleIds.has(m));

  if (allPassed) {
    const currentYear = new Date().getFullYear().toString();
    await Student.findByIdAndUpdate(studentId, {
      isGraduated: true,
      yearGraduated: currentYear,
    });
    return { graduated: true };
  }

  return { graduated: false };
}

module.exports = { checkAndGraduateStudent };
