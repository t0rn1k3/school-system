const crypto = require("crypto");
const NodeCache = require("node-cache");

/**
 * In-memory auth cache to avoid MongoDB lookups on every request.
 * Cache key: hash of the token (does not store raw tokens).
 * TTL: 5 minutes (configurable via AUTH_CACHE_TTL_SEC).
 */
const TTL_SEC = parseInt(process.env.AUTH_CACHE_TTL_SEC || "300", 10); // 5 min default
const authCache = new NodeCache({ stdTTL: TTL_SEC, checkperiod: 60 });

function getCacheKey(token) {
  return "auth:" + crypto.createHash("sha256").update(token).digest("hex");
}

function get(token) {
  if (!token) return null;
  const key = getCacheKey(token);
  return authCache.get(key) || null;
}

function set(token, user) {
  if (!token || !user) return;
  const key = getCacheKey(token);
  const plain = user.toObject ? user.toObject() : (typeof user === "object" ? { ...user } : user);
  if (!plain._id) plain._id = user._id;
  authCache.set(key, plain, TTL_SEC);
}

function del(token) {
  if (!token) return;
  authCache.del(getCacheKey(token));
}

/** Invalidate by cache key prefix (e.g. after logout or password change when token is unavailable) */
function delByKey(key) {
  authCache.del(key);
}

module.exports = { get, set, del, delByKey, getCacheKey };
