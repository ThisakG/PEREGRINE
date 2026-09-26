// =============================================================================
// geminiClient.js  (Member 03 - AI Parsing & Output Generation)
// -----------------------------------------------------------------------------
// WHAT: The single place that actually calls the Gemini generateContent
//       API, using structured-output mode so the model is constrained to
//       return valid JSON matching our schema (belt-and-braces alongside
//       the JSON-only instructions in promptBuilder.js).
// WHY structured output (responseMimeType + responseSchema):
//       Without it, a generative model can wrap its answer in prose
//       ("Sure, here's the analysis: ...") or markdown code fences,
//       forcing fragile string-parsing downstream. Constraining the
//       response format at the API level means Member 03's parser
//       (responseParser.js) receives clean JSON to work with the vast
//       majority of the time, with the try/catch fallback in that file
//       covering the rare case where it still doesn't.
// =============================================================================

import axios from "axios";
import { env } from "../../config/env.js";
import { getRotatedKeyOrder, hasAnyGeminiKey } from "./geminiKeyPool.js";
import { logger } from "../../utils/logger.js";

const REQUEST_TIMEOUT_MS = 15000;

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    riskRating: { type: "string", enum: ["low", "medium", "high", "critical"] },
    recommendations: { type: "array", items: { type: "string" } },
  },
  required: ["summary", "riskRating", "recommendations"],
};

/**
 * Calls Gemini with automatic key rotation and fail-over.
 * @param {{systemInstructions:string, userPrompt:string}} prompt
 * @returns {Promise<string>} raw JSON text from the model
 * @throws if no keys are configured, or every key fails
 */
export async function callGemini(prompt) {
  if (!hasAnyGeminiKey()) {
    throw new Error("No Gemini API keys configured.");
  }

  const keysInOrder = getRotatedKeyOrder();
  let lastError;

  for (const apiKey of keysInOrder) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${env.gemini.model}:generateContent`;

      const response = await axios.post(
        url,
        {
          systemInstruction: { parts: [{ text: prompt.systemInstructions }] },
          contents: [{ role: "user", parts: [{ text: prompt.userPrompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
            responseSchema: RESPONSE_SCHEMA,
            temperature: 0.2, // low temperature: this is an analytical task, not creative writing
          },
        },
        {
          // Sent as a header, not a URL query param, so it never ends up
          // logged in access logs / browser history the way "?key=..."
          // query-string auth would.
          headers: { "x-goog-api-key": apiKey, "Content-Type": "application/json" },
          timeout: REQUEST_TIMEOUT_MS,
        }
      );

      const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) throw new Error("Gemini returned an empty response.");
      return text;
    } catch (error) {
      lastError = error;
      const status = error.response?.status;
      logger.warn("Gemini call failed on one key, will try next if available", {
        status,
        message: error.message,
      });
      // 429 (quota exceeded) or 5xx are exactly the cases key rotation is
      // meant to route around - continue the loop to the next key.
      // A 400 (bad request/malformed prompt) or 401/403 (bad single key)
      // would fail identically on every other key too... but the cost of
      // trying the next key anyway is low, so we keep it simple and always
      // try all keys before giving up.
      continue;
    }
  }

  throw lastError ?? new Error("All configured Gemini keys failed.");
}
