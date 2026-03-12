/**
 * Utilities for Learning Outcomes and criteria (Georgian vocational modules).
 */

/**
 * Normalize a criterion for effectiveCriteria: ensure id and display name.
 * @param {Object} c - Raw criterion (id, name, criterionName, title, description)
 * @returns {Object} { id, _id, name } - name is name || criterionName || title || description
 */
function normalizeCriterionForDisplay(c) {
  const id = (c?.id ?? c?._id ?? "").toString().trim() || undefined;
  const name =
    (c?.name || c?.criterionName || c?.title || c?.description || "").toString().trim() ||
    "Criterion";
  return {
    id,
    _id: id,
    name,
    ...(c?.description && { description: c.description }),
  };
}

/**
 * Get effective criteria for an exam based on scopeType and learningOutcomeIds.
 * @param {Object} module - Module doc with learningOutcomes (or legacy criteria)
 * @param {Object} exam - Exam doc with scopeType, learningOutcomeIds
 * @returns {Array} Flat list of criteria { id, _id, name, description? } for teacher grading display
 */
function getEffectiveCriteriaForExam(module, exam) {
  const learningOutcomes = module?.learningOutcomes || [];
  const legacyCriteria = module?.criteria || [];
  let raw = [];

  // Prefer learningOutcomes when present
  if (learningOutcomes.length > 0) {
    const scopeType = exam?.scopeType || "all-los";
    const loIds = (exam?.learningOutcomeIds || []).filter(Boolean);

    if (scopeType === "all-los" || (scopeType !== "single-lo" && scopeType !== "multiple-los")) {
      raw = learningOutcomes
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((lo) => (lo.criteria || []).map((c) => ({ ...c })));
    } else if (scopeType === "single-lo" || scopeType === "multiple-los") {
      if (loIds.length === 0) return [];
      const allowedIds = new Set(loIds.map(String));
      raw = learningOutcomes
        .filter((lo) => allowedIds.has(String(lo.id)))
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .flatMap((lo) => (lo.criteria || []).map((c) => ({ ...c })));
    }
  } else {
    raw = legacyCriteria;
  }

  return raw.map(normalizeCriterionForDisplay).filter((c) => c.id);
}

/**
 * Normalize and validate learningOutcomes from request body.
 * @param {Array} learningOutcomes - Raw learningOutcomes from request
 * @returns {{ valid: boolean, normalized?: Array, message?: string }}
 */
function normalizeLearningOutcomes(learningOutcomes) {
  if (!Array.isArray(learningOutcomes) || learningOutcomes.length === 0) {
    return { valid: false, message: "At least one Learning Outcome is required per module" };
  }
  const seenLoIds = new Set();
  const seenCritIds = new Set();
  const normalized = [];
  for (let i = 0; i < learningOutcomes.length; i++) {
    const lo = learningOutcomes[i];
    const id = (lo.id || `lo${i + 1}`).toString().trim();
    if (!id) {
      return { valid: false, message: "Each Learning Outcome must have an id" };
    }
    if (seenLoIds.has(id)) {
      return { valid: false, message: `Duplicate Learning Outcome id: ${id}` };
    }
    seenLoIds.add(id);
    const criteria = Array.isArray(lo.criteria) ? lo.criteria : [];
    if (criteria.length === 0) {
      return { valid: false, message: `Learning Outcome "${lo.name || id}" must have at least one criterion` };
    }
    const normCriteria = [];
    for (let j = 0; j < criteria.length; j++) {
      const c = criteria[j];
      const cid = (c.id || `c${j + 1}`).toString().trim();
      if (seenCritIds.has(cid)) {
        return { valid: false, message: `Duplicate criterion id ${cid} within module` };
      }
      seenCritIds.add(cid);
      normCriteria.push({
        id: cid,
        name: (c.name || "").trim(),
        description: (c.description || "").trim(),
      });
    }
    normalized.push({
      id,
      order: Number.isFinite(Number(lo.order)) ? Number(lo.order) : i + 1,
      name: (lo.name || "").trim(),
      description: (lo.description || "").trim(),
      criteria: normCriteria,
    });
  }
  return { valid: true, normalized };
}

/**
 * Migrate flat criteria to a single default Learning Outcome.
 * @param {Array} criteria - Flat criteria array
 * @returns {Array} learningOutcomes with one default LO
 */
function migrateCriteriaToLearningOutcomes(criteria) {
  if (!Array.isArray(criteria) || criteria.length === 0) {
    return [];
  }
  return [
    {
      id: "lo1",
      order: 1,
      name: "საერთო კრიტერიუმები",
      description: "",
      criteria: criteria.map((c, i) => ({
        id: c.id || `c${i + 1}`,
        name: c.name || "",
        description: c.description || "",
      })),
    },
  ];
}

module.exports = {
  getEffectiveCriteriaForExam,
  normalizeLearningOutcomes,
  migrateCriteriaToLearningOutcomes,
};
