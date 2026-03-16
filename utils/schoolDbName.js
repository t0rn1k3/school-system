/** MongoDB Atlas limits database names to 38 bytes. */
const MAX_DB_BYTES = 38;

/**
 * Generate a MongoDB database name from school name.
 * MongoDB: max 38 bytes (Atlas), cannot contain /\. "$*<>:|?
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
 * Truncate string to fit within max byte length (UTF-8).
 */
function truncateToBytes(str, maxBytes) {
  const buf = Buffer.from(str, "utf8");
  if (buf.length <= maxBytes) return str;
  let len = maxBytes;
  while (len > 0 && (buf[len] & 0xc0) === 0x80) len--;
  return buf.slice(0, len).toString("utf8");
}

/**
 * @param {string} schoolName - Display name (e.g. "Central High School" or Georgian)
 * @param {string} uniqueId - ObjectId or similar for uniqueness (e.g. schoolId.toString())
 * @returns {string} e.g. "lms_central-high-school_a1b2c3d4" (max 38 bytes for Atlas)
 */
function buildSchoolDbName(schoolName, uniqueId) {
  const id = String(uniqueId || "").slice(0, 8) || "00000000";
  const prefix = "lms_";
  const suffix = `_${id}`;
  const prefixSuffixBytes = Buffer.byteLength(prefix + suffix, "utf8");
  const maxSlugBytes = MAX_DB_BYTES - prefixSuffixBytes;

  let slug = slugifySchoolName(schoolName);
  slug = truncateToBytes(slug, maxSlugBytes) || "school";

  return `${prefix}${slug}_${id}`;
}

module.exports = { slugifySchoolName, buildSchoolDbName };
