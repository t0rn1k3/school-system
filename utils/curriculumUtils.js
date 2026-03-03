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

/**
 * Validate that weeklyOverrides sum equals contactHours + assessmentHours within module date range.
 * @param {Object} module - Module with contactHours, assessmentHours, durationWeeks, startWeek, weeklyOverrides
 * @returns {{ valid: boolean, message?: string }}
 */
function validateWeeklyOverrides(module) {
  const totalRequired = (module.contactHours || 0) + (module.assessmentHours || 0);
  const duration = module.durationWeeks || 0;
  const start = module.startWeek ?? 1;
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
      const week = parseInt(weekStr, 10);
      if (!Number.isNaN(week) && week >= start && week <= endWeek) {
        sum += Number(value) || 0;
      }
    }
  }

  const valid = sum === totalRequired;
  return {
    valid,
    message: valid ? undefined : `Weekly hours sum (${sum}) must equal contact+assessment (${totalRequired})`,
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
 * @param {Object} module - Module doc with weeklyOverrides, contactHours, assessmentHours, durationWeeks, startWeek
 * @returns {Object} Week number (string key) -> hours
 */
function getEffectiveWeeklyHours(module) {
  const overrides = module.weeklyOverrides;
  const hasOverrides = overrides && (
    (overrides instanceof Map && overrides.size > 0) ||
    (typeof overrides === "object" && Object.keys(overrides).length > 0)
  );

  if (hasOverrides) {
    const plain = overrides instanceof Map
      ? Object.fromEntries(overrides)
      : overrides;
    return { ...plain };
  }

  const total = (module.contactHours || 0) + (module.assessmentHours || 0);
  const duration = module.durationWeeks || 0;
  const start = module.startWeek ?? 1;

  if (duration <= 0) return {};
  return distributeHoursEvenly(total, duration, start);
}

module.exports = {
  distributeHoursEvenly,
  validateWeeklyOverrides,
  getWeekLabels,
  getEffectiveWeeklyHours,
};
