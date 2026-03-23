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
 * Validate that sum(weeklyOverrides) equals contactHours + assessmentHours.
 * Uses a small tolerance (0.01) for floating point comparison.
 * Note: Only contactHours and assessmentHours are summed; independentHours are excluded.
 *
 * By default, validates only inside module week range.
 * For curriculum-wide editing, pass { restrictToModuleRange: false, minWeek: 1, maxWeek: programWeeks }.
 *
 * @param {Object} module - Module with contactHours, assessmentHours, durationWeeks, startWeek, weeklyOverrides
 * @param {Object} options - Validation options
 * @param {boolean} options.restrictToModuleRange - Default true. If false, uses min/max bounds.
 * @param {number} options.minWeek - Optional inclusive lower week bound
 * @param {number} options.maxWeek - Optional inclusive upper week bound
 * @returns {{ valid: boolean, message?: string, sum?: number, expected?: number }}
 */
function validateWeeklyOverrides(module, options = {}) {
  const totalRequired = (Number(module.contactHours) || 0) + (Number(module.assessmentHours) || 0);
  const duration = Number(module.durationWeeks) || 0;
  const start = module.startWeek != null ? Number(module.startWeek) : 1;
  const endWeek = start + duration - 1;

  if (duration <= 0) {
    return { valid: true };
  }

  const overrides = module.weeklyOverrides;
  const restrictToModuleRange = options.restrictToModuleRange !== false;
  const minWeek = options.minWeek != null
    ? Number(options.minWeek)
    : (restrictToModuleRange ? start : 1);
  const maxWeek = options.maxWeek != null
    ? Number(options.maxWeek)
    : (restrictToModuleRange ? endWeek : Number.POSITIVE_INFINITY);
  let sum = 0;

  if (overrides && typeof overrides === "object") {
    const entries = overrides instanceof Map
      ? [...overrides.entries()]
      : Object.entries(overrides);

    for (const [weekStr, value] of entries) {
      const week = parseInt(String(weekStr), 10);
      if (!Number.isNaN(week) && week >= minWeek && week <= maxWeek) {
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
      minWeek,
      maxWeek,
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
 * Always returns a complete object for all weeks in the selected window.
 * Default window is module range; when totalWeeks is provided, window is 1..totalWeeks.
 * @param {Object} module - Module doc with weeklyOverrides, contactHours, assessmentHours, durationWeeks, startWeek
 * @param {number} totalWeeks - Optional program duration in weeks
 * @returns {Object} Week number (string key) -> hours; only non-zero weeks are included
 */
function getEffectiveWeeklyHours(module, totalWeeks) {
  const duration = Number(module.durationWeeks) || 0;
  const start = module.startWeek != null ? Number(module.startWeek) : 1;
  const programWeeks = Number(totalWeeks) || 0;
  const useProgramWindow = programWeeks > 0;
  if (!useProgramWindow && duration <= 0) return {};

  const overrides = module.weeklyOverrides;
  const plain = overrides && (overrides instanceof Map || typeof overrides === "object")
    ? (overrides instanceof Map ? Object.fromEntries(overrides) : overrides)
    : {};

  const total = (Number(module.contactHours) || 0) + (Number(module.assessmentHours) || 0);
  const hasOverrides = Object.keys(plain).some(
    (k) => !Number.isNaN(parseInt(k, 10)) && (Number(plain[k]) || 0) !== 0
  );

  const rangeStart = useProgramWindow ? 1 : start;
  const rangeEnd = useProgramWindow ? programWeeks : (start + duration - 1);

  const result = {};
  for (let week = rangeStart; week <= rangeEnd; week++) {
    const key = String(week);
    const overrideVal = plain[key];
    const val = overrideVal != null ? (Number(overrideVal) || 0) : 0;
    if (val !== 0) result[key] = val;
  }

  if (!hasOverrides && total > 0 && duration > 0) {
    const dist = distributeHoursEvenly(total, duration, start);
    if (!useProgramWindow) {
      const filtered = {};
      Object.entries(dist).forEach(([k, v]) => {
        if ((Number(v) || 0) !== 0) filtered[k] = v;
      });
      return filtered;
    }
    Object.entries(dist).forEach(([k, v]) => {
      const week = parseInt(String(k), 10);
      const val = Number(v) || 0;
      if (!Number.isNaN(week) && week >= 1 && week <= programWeeks && val !== 0) {
        result[String(k)] = val;
      }
    });
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
