// =============================================================================
// responseParser.js  (Member 03 - AI Parsing & Output Generation)
// -----------------------------------------------------------------------------
// WHAT: Turns Gemini's raw text response into the defined structured
//       fields Peregrine promises the frontend: { summary, riskRating,
//       recommendations }, and is the FALLBACK boundary - if the AI call
//       fails entirely or returns something unparseable, this is where we
//       decide "the matrix data still gets returned to the dashboard on
//       its own" per the proposal's Stage 5 description.
// WHY the defensive parsing:
//   - structured-output mode in geminiClient.js makes malformed JSON rare,
//     but "rare" is not "never" - a try/catch around JSON.parse plus a
//     shape check is cheap insurance against a UI crash on the one time
//     in a hundred the model (or a network hiccup) returns something odd.
//   - riskRating is re-validated against the allowed enum here too, not
//     just trusted from the API's schema enforcement, because Member 03
//     owns this data on the way INTO the database (historyStore.js) - a
//     stray value here would otherwise get silently cached and served on
//     every future cache hit for that IoC.
// =============================================================================

import { buildAiPrompt } from "./promptBuilder.js";
import { callGemini } from "./geminiClient.js";
import { logger } from "../../utils/logger.js";

const ALLOWED_RISK_RATINGS = new Set(["low", "medium", "high", "critical"]);

function isValidShape(parsed) {
  return (
    parsed &&
    typeof parsed.summary === "string" &&
    ALLOWED_RISK_RATINGS.has(parsed.riskRating) &&
    Array.isArray(parsed.recommendations) &&
    parsed.recommendations.every((r) => typeof r === "string")
  );
}

/**
 * Runs the full AI synthesis step for a completed correlation matrix.
 * Never throws - always returns either a valid synthesis object or null,
 * so the caller (routes/iocRoutes.js) can always respond to the analyst
 * with at least the matrix, AI or no AI.
 *
 * @param {{type:string, value:string}} ioc
 * @param {object} matrix
 * @returns {Promise<{summary:string, riskRating:string, recommendations:string[]}|null>}
 */
export async function synthesizeAiSummary(ioc, matrix) {
  try {
    const prompt = buildAiPrompt(ioc, matrix);
    const rawText = await callGemini(prompt);

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      logger.warn("Gemini response was not valid JSON; discarding AI result for this lookup.");
      return null;
    }

    if (!isValidShape(parsed)) {
      logger.warn("Gemini response JSON did not match the expected schema; discarding.", {
        keys: parsed ? Object.keys(parsed) : [],
      });
      return null;
    }

    // Defensive cap: even though we asked for 3-5 recommendations, never
    // let a runaway response balloon the UI or the stored cache row.
    return {
      summary: parsed.summary.slice(0, 2000),
      riskRating: parsed.riskRating,
      recommendations: parsed.recommendations.slice(0, 8).map((r) => r.slice(0, 500)),
    };
  } catch (error) {
    // Covers: no keys configured, every key exhausted/erroring, network
    // failure, timeout. This is the "AI call fails" fallback path the
    // proposal explicitly calls out (Stage 5) - the matrix must still
    // reach the dashboard.
    logger.error("AI synthesis unavailable for this lookup; returning matrix-only result.", {
      message: error.message,
    });
    return null;
  }
}
