/**
 * Validation and grading utilities for language test question types.
 * Used for gap-fill, translation, correct-mistake, matching, sentence-ordering.
 */

const QUESTION_TYPES = [
  "multiple-choice",
  "open-ended",
  "gap-fill",
  "translation",
  "correct-mistake",
  "matching",
  "sentence-ordering",
  "long-form",
];

/** Question types that can be auto-graded */
const AUTO_GRADEABLE_TYPES = ["gap-fill", "correct-mistake", "matching", "sentence-ordering"];

/** Question types that always need manual grading */
const MANUAL_GRADEABLE_TYPES = ["open-ended", "translation", "long-form"];

/**
 * Validate question payload for a given questionType.
 * @returns {{ valid: boolean, message?: string }}
 */
function validateQuestionPayload(questionType, body) {
  switch (questionType) {
    case "gap-fill": {
      const p = body.gapFillPayload;
      if (!p || typeof p !== "object") {
        return { valid: false, message: "gapFillPayload is required for gap-fill questions" };
      }
      if (!p.contentWithBlanks || typeof p.contentWithBlanks !== "string") {
        return { valid: false, message: "gapFillPayload.contentWithBlanks is required" };
      }
      const blankCount = (p.contentWithBlanks.match(/_____|\{[0-9]+\}/g) || []).length;
      if (blankCount === 0) {
        return { valid: false, message: "contentWithBlanks must contain at least one blank (_____ or {0})" };
      }
      const correctAnswers = Array.isArray(p.correctAnswers) ? p.correctAnswers : [];
      if (correctAnswers.length !== blankCount) {
        return {
          valid: false,
          message: `correctAnswers must have ${blankCount} entries (one per blank)`,
        };
      }
      const wordBank = Array.isArray(p.wordBank) ? p.wordBank : [];
      if (wordBank.length === 0) {
        return { valid: false, message: "gapFillPayload.wordBank is required (at least one word)" };
      }
      return { valid: true };
    }

    case "translation": {
      const p = body.translationPayload;
      if (!p || typeof p !== "object") {
        return { valid: false, message: "translationPayload is required for translation questions" };
      }
      if (!p.sourceText || typeof p.sourceText !== "string") {
        return { valid: false, message: "translationPayload.sourceText is required" };
      }
      return { valid: true };
    }

    case "correct-mistake": {
      const p = body.correctMistakePayload;
      if (!p || typeof p !== "object") {
        return { valid: false, message: "correctMistakePayload is required for correct-mistake questions" };
      }
      if (!p.incorrectSentence || typeof p.incorrectSentence !== "string") {
        return { valid: false, message: "correctMistakePayload.incorrectSentence is required" };
      }
      const correctAnswers = Array.isArray(p.correctAnswers) ? p.correctAnswers : [];
      if (correctAnswers.length === 0) {
        return { valid: false, message: "correctMistakePayload.correctAnswers must have at least one accepted answer" };
      }
      return { valid: true };
    }

    case "matching": {
      const p = body.matchingPayload;
      if (!p || typeof p !== "object") {
        return { valid: false, message: "matchingPayload is required for matching questions" };
      }
      const leftItems = Array.isArray(p.leftItems) ? p.leftItems : [];
      const rightItems = Array.isArray(p.rightItems) ? p.rightItems : [];
      if (leftItems.length === 0 || rightItems.length === 0) {
        return { valid: false, message: "matchingPayload.leftItems and rightItems are required" };
      }
      if (leftItems.length !== rightItems.length) {
        return { valid: false, message: "matchingPayload leftItems and rightItems must have the same length" };
      }
      const correctPairs = Array.isArray(p.correctPairs) ? p.correctPairs : [];
      if (correctPairs.length !== leftItems.length) {
        return {
          valid: false,
          message: `correctPairs must have ${leftItems.length} pairs (one per left item)`,
        };
      }
      return { valid: true };
    }

    case "sentence-ordering": {
      const p = body.sentenceOrderingPayload;
      if (!p || typeof p !== "object") {
        return { valid: false, message: "sentenceOrderingPayload is required for sentence-ordering questions" };
      }
      const jumbledWords = Array.isArray(p.jumbledWords) ? p.jumbledWords : [];
      const correctOrder = Array.isArray(p.correctOrder) ? p.correctOrder : [];
      if (jumbledWords.length < 2) {
        return { valid: false, message: "sentenceOrderingPayload.jumbledWords must have at least 2 words" };
      }
      if (correctOrder.length !== jumbledWords.length) {
        return {
          valid: false,
          message: "correctOrder must have same length as jumbledWords",
        };
      }
      const sorted = [...correctOrder].sort((a, b) => a - b);
      const expected = jumbledWords.map((_, i) => i);
      if (JSON.stringify(sorted) !== JSON.stringify(expected)) {
        return { valid: false, message: "correctOrder must be a permutation of indices 0..n-1" };
      }
      return { valid: true };
    }

    case "long-form":
      // Same as open-ended; no extra payload required
      return { valid: true };

    case "multiple-choice":
    case "open-ended":
      // Handled in controller
      return { valid: true };

    default:
      return { valid: false, message: `Unknown questionType: ${questionType}` };
  }
}

/**
 * Whether this question type can be auto-graded.
 */
function isAutoGradeable(questionType) {
  return AUTO_GRADEABLE_TYPES.includes(questionType);
}

/**
 * Whether this question type always requires manual grading.
 */
function needsManualGrading(questionType) {
  return MANUAL_GRADEABLE_TYPES.includes(questionType);
}

/**
 * Build payload object for create/update (only include fields for the question's type).
 */
function buildPayloadForType(questionType, body) {
  const payload = {};
  if (questionType === "gap-fill" && body.gapFillPayload) {
    payload.gapFillPayload = body.gapFillPayload;
  }
  if (questionType === "translation" && body.translationPayload) {
    payload.translationPayload = body.translationPayload;
  }
  if (questionType === "correct-mistake" && body.correctMistakePayload) {
    payload.correctMistakePayload = body.correctMistakePayload;
  }
  if (questionType === "matching" && body.matchingPayload) {
    payload.matchingPayload = body.matchingPayload;
  }
  if (questionType === "sentence-ordering" && body.sentenceOrderingPayload) {
    payload.sentenceOrderingPayload = body.sentenceOrderingPayload;
  }
  return payload;
}

module.exports = {
  QUESTION_TYPES,
  AUTO_GRADEABLE_TYPES,
  MANUAL_GRADEABLE_TYPES,
  validateQuestionPayload,
  isAutoGradeable,
  needsManualGrading,
  buildPayloadForType,
};
