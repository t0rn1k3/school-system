/**
 * API error response helper with messageKey for frontend i18n.
 * Backend returns messageKey; frontend looks up translation by locale.
 */

/**
 * Send error response with messageKey for translation lookup.
 * @param {Object} res - Express response
 * @param {number} status - HTTP status code
 * @param {string} messageKey - Key for frontend translation (e.g. "exam.not_found")
 * @param {string} message - Fallback message (typically English)
 */
function sendError(res, status, messageKey, message) {
  return res.status(status).json({
    status: "failed",
    messageKey: messageKey || undefined,
    message: message || "An error occurred",
  });
}

module.exports = { sendError };
