/**
 * Generate a MongoDB database name from school name.
 * MongoDB limits: 64 bytes, cannot contain /\. "$*<>:|?
 * Format: lms_<slug>_<shortId> for readability and uniqueness.
 */
function slugifySchoolName(name) {
  if (!name || typeof name !== "string") return "school";
  let slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[/\\."$*<>:|?]/g, "") // MongoDB-invalid chars
    .replace(/[^a-z0-9\u00C0-\u024F\u0400-\u04FF\u10A0-\u10FF-]/g, "") // keep letters (incl. Georgian), digits, hyphens
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 45);
  return slug || "school";
}

/**
 * @param {string} schoolName - Display name (e.g. "Central High School")
 * @param {string} uniqueId - ObjectId or similar for uniqueness (e.g. schoolId.toString())
 * @returns {string} e.g. "lms_central-high-school_a1b2c3d4" (max 64 chars for MongoDB)
 */
function buildSchoolDbName(schoolName, uniqueId) {
  const slug = slugifySchoolName(schoolName);
  const id = String(uniqueId || "").slice(0, 8) || "00000000";
  const dbName = `lms_${slug}_${id}`;
  return dbName.length <= 64 ? dbName : dbName.slice(0, 64);
}

module.exports = { slugifySchoolName, buildSchoolDbName };
