/**
 * Curriculum utilities for vocational program planning.
 * Based on planEd-Web logic.
 */

/**
 * Distribute contact+assessment hours evenly across weeks.
 * Same logic as planEd-Web.
 * @param {number} total - Total hours (contact + assessment)
 * @param {number} durationWeeks - Number of weeks to distribute across
 * @param {number} startWeek - 1-based start week
 * @returns {Object} Week number (as string key) -> hours, e.g. { "1": 0, "2": 4, "3": 3, "4": 3 }
 */
function distributeHoursEvenly(total, durationWeeks, startWeek = 1) {
  const result = {};
  for (let i = 1; i < startWeek; i++) {
    result[String(i)] = 0;
  }
  const base = Math.floor(total / durationWeeks);
  const remainder = total % durationWeeks;
  for (let i = 0; i < durationWeeks; i++) {
    result[String(startWeek + i)] = base + (i < remainder ? 1 : 0);
  }
  return result;
}

/** Floating point tolerance for sum validation (hours) */
const SUM_TOLERANCE = 0.01;

/**
 * Filter weeklyOverrides to only weeks in the module's range [startWeek, startWeek+durationWeeks-1].
 * Extra weeks are dropped. Accepts string or numeric keys (JSON keys are always strings).
 * @returns {Object} Plain object with string keys, weeks in range only
 */
function filterWeeklyOverridesToRange(weeklyOverrides, startWeek, durationWeeks) {
  const start = Number(startWeek) || 1;
  const duration = Number(durationWeeks) || 0;
  const endWeek = start + duration - 1;
  if (duration <= 0) return {};

  const plain = weeklyOverrides && (weeklyOverrides instanceof Map || typeof weeklyOverrides === "object")
    ? (weeklyOverrides instanceof Map ? Object.fromEntries(weeklyOverrides) : weeklyOverrides)
    : {};
  const result = {};
  for (const [k, v] of Object.entries(plain)) {
    const week = parseInt(String(k), 10);
    if (!Number.isNaN(week) && week >= start && week <= endWeek) {
      result[String(k)] = Number(v) || 0;
    }
  }
  return result;
}

/**
 * Validate that sum(weeklyOverrides) equals contactHours + assessmentHours within module date range.
 * Uses a small tolerance (0.01) for floating point comparison.
 * Note: Only contactHours and assessmentHours are summed; independentHours are excluded.
 *
 * @param {Object} module - Module with contactHours, assessmentHours, durationWeeks, startWeek, weeklyOverrides
 * @returns {{ valid: boolean, message?: string, sum?: number, expected?: number }}
 */
function validateWeeklyOverrides(module) {
  const totalRequired = (Number(module.contactHours) || 0) + (Number(module.assessmentHours) || 0);
  const duration = Number(module.durationWeeks) || 0;
  const start = module.startWeek != null ? Number(module.startWeek) : 1;
  const endWeek = start + duration - 1;

  if (duration <= 0) {
    return { valid: true };
  }

  const overrides = module.weeklyOverrides;
  let sum = 0;

  if (overrides && typeof overrides === "object") {
    const entries = overrides instanceof Map
      ? [...overrides.entries()]
      : Object.entries(overrides);

    for (const [weekStr, value] of entries) {
      const week = parseInt(String(weekStr), 10);
      if (!Number.isNaN(week) && week >= start && week <= endWeek) {
        sum += Number(value) || 0;
      }
    }
  }

  const diff = Math.abs(sum - totalRequired);
  const valid = diff < SUM_TOLERANCE;

  if (!valid) {
    console.warn("[validateWeeklyOverrides] Sum validation failed", {
      contactHours: module.contactHours,
      assessmentHours: module.assessmentHours,
      expected: totalRequired,
      computedSum: sum,
      startWeek: start,
      endWeek,
      weeklyOverridesKeys: overrides ? Object.keys(overrides instanceof Map ? Object.fromEntries(overrides) : overrides) : [],
    });
  }

  return {
    valid,
    message: valid ? undefined : `Weekly hours sum (${sum.toFixed(2)}) must equal contact+assessment (${totalRequired})`,
    sum,
    expected: totalRequired,
  };
}

/**
 * Get week labels for table headers.
 * @param {Date|string} startDate - Program start date
 * @param {number} totalWeeks - Number of weeks
 * @returns {string[]} Array of "DD.MM.YYYY - DD.MM.YYYY" strings
 */
function getWeekLabels(startDate, totalWeeks) {
  if (!startDate || totalWeeks <= 0) {
    return Array.from({ length: totalWeeks }, () => "");
  }
  const start = new Date(startDate);
  const options = { day: "2-digit", month: "2-digit", year: "numeric" };
  const locale = "ka-GE";

  return Array.from({ length: totalWeeks }, (_, i) => {
    const s = new Date(start);
    s.setDate(s.getDate() + i * 7);
    const e = new Date(s);
    e.setDate(e.getDate() + 6);
    return `${s.toLocaleDateString(locale, options)} - ${e.toLocaleDateString(locale, options)}`;
  });
}

/**
 * Get effective weekly hours for a module (stored overrides or computed).
 * Always returns a complete object for all weeks in the module's range (startWeek to startWeek+durationWeeks-1),
 * so the frontend can render an input for every cell including empty ones (value 0).
 * @param {Object} module - Module doc with weeklyOverrides, contactHours, assessmentHours, durationWeeks, startWeek
 * @returns {Object} Week number (string key) -> hours; all weeks in range present (0 for empty)
 */
function getEffectiveWeeklyHours(module) {
  const duration = Number(module.durationWeeks) || 0;
  const start = module.startWeek != null ? Number(module.startWeek) : 1;

  if (duration <= 0) return {};

  const overrides = module.weeklyOverrides;
  const plain = overrides && (overrides instanceof Map || typeof overrides === "object")
    ? (overrides instanceof Map ? Object.fromEntries(overrides) : overrides)
    : {};

  const total = (Number(module.contactHours) || 0) + (Number(module.assessmentHours) || 0);
  const hasOverrides = Object.keys(plain).some(
    (k) => !Number.isNaN(parseInt(k, 10)) && (Number(plain[k]) || 0) !== 0
  );

  const result = {};
  for (let i = 0; i < duration; i++) {
    const week = start + i;
    const key = String(week);
    const overrideVal = plain[key];
    result[key] = overrideVal != null ? (Number(overrideVal) || 0) : 0;
  }

  if (!hasOverrides && total > 0) {
    return distributeHoursEvenly(total, duration, start);
  }
  return result;
}

module.exports = {
  distributeHoursEvenly,
  validateWeeklyOverrides,
  filterWeeklyOverridesToRange,
  getWeekLabels,
  getEffectiveWeeklyHours,
};
