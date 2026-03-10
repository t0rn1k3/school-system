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
 * Auto-grade a student answer for structured question types.
 * @param {Object} question - Question doc with questionType and payload
 * @param {*} studentAnswer - Raw answer: string, array, or object
 * @returns {{ isCorrect: boolean, pointsAwarded: number } | null } null if not auto-gradeable
 */
function gradeAnswer(question, studentAnswer) {
  const qType = question?.questionType;
  if (!AUTO_GRADEABLE_TYPES.includes(qType)) return null;

  const mark = question.mark ?? 1;

  switch (qType) {
    case "gap-fill": {
      const p = question.gapFillPayload;
      if (!p || !Array.isArray(p.correctAnswers)) return { isCorrect: false, pointsAwarded: 0 };
      const answers = Array.isArray(studentAnswer) ? studentAnswer : [];
      if (answers.length !== p.correctAnswers.length) return { isCorrect: false, pointsAwarded: 0 };
      let allCorrect = true;
      for (let i = 0; i < p.correctAnswers.length; i++) {
        const accepted = (p.correctAnswers[i] || []).map((v) => String(v).toLowerCase().trim());
        const given = String(answers[i] || "").toLowerCase().trim();
        if (!accepted.length || !accepted.includes(given)) {
          allCorrect = false;
          break;
        }
      }
      return {
        isCorrect: allCorrect,
        pointsAwarded: allCorrect ? mark : 0,
      };
    }

    case "correct-mistake": {
      const p = question.correctMistakePayload;
      if (!p || !Array.isArray(p.correctAnswers) || p.correctAnswers.length === 0) {
        return { isCorrect: false, pointsAwarded: 0 };
      }
      const given = String(studentAnswer || "").toLowerCase().trim();
      const accepted = p.correctAnswers.map((v) => String(v).toLowerCase().trim());
      const isCorrect = accepted.includes(given);
      return {
        isCorrect,
        pointsAwarded: isCorrect ? mark : 0,
      };
    }

    case "matching": {
      const p = question.matchingPayload;
      if (!p || !Array.isArray(p.correctPairs)) return { isCorrect: false, pointsAwarded: 0 };
      const pairs = Array.isArray(studentAnswer) ? studentAnswer : [];
      if (pairs.length !== p.correctPairs.length) return { isCorrect: false, pointsAwarded: 0 };
      let correctCount = 0;
      const correctSet = new Set(
        p.correctPairs.map(([l, r]) => `${l},${r}`),
      );
      for (const pair of pairs) {
        const [l, r] = Array.isArray(pair) ? pair : [pair?.left, pair?.right];
        if (correctSet.has(`${l},${r}`)) correctCount++;
      }
      const isCorrect = correctCount === p.correctPairs.length;
      return {
        isCorrect,
        pointsAwarded: isCorrect ? mark : 0,
      };
    }

    case "sentence-ordering": {
      const p = question.sentenceOrderingPayload;
      if (!p || !Array.isArray(p.correctOrder)) return { isCorrect: false, pointsAwarded: 0 };
      const order = Array.isArray(studentAnswer) ? studentAnswer : [];
      if (order.length !== p.correctOrder.length) return { isCorrect: false, pointsAwarded: 0 };
      const isCorrect =
        JSON.stringify(order.map(Number)) ===
        JSON.stringify(p.correctOrder.map(Number));
      return {
        isCorrect,
        pointsAwarded: isCorrect ? mark : 0,
      };
    }

    default:
      return null;
  }
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
  gradeAnswer,
  buildPayloadForType,
};
