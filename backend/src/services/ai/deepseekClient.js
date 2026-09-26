// =============================================================================
// deepseekClient.js  (Member 03 - AI Parsing & Output Generation)
// -----------------------------------------------------------------------------
// WHAT: Calls DeepSeek's OpenAI-compatible chat completions endpoint.
// WHY this replaced geminiClient.js: Google's Gemini Developer API was
// returning inconsistent 404s on generateContent for newly-provisioned
// AI Studio projects (a known, still-open issue on Google's side as of
// this project's build) even with valid keys and valid model names.
// DeepSeek's API has none of that - stable OpenAI-shaped request/response,
// simple Bearer auth, and JSON-mode structured output support.
// =============================================================================

import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const REQUEST_TIMEOUT_MS = 20000;

/**
 * @param {{systemInstructions:string, userPrompt:string}} prompt
 * @returns {Promise<string>} raw JSON text from the model
 */
export async function callDeepSeek(prompt) {
  if (!env.deepseek.apiKey) {
    throw new Error("No DeepSeek API key configured.");
  }

  try {
    const response = await axios.post(
      "https://api.deepseek.com/v1/chat/completions",
      {
        model: env.deepseek.model,
        messages: [
          { role: "system", content: prompt.systemInstructions },
          { role: "user", content: prompt.userPrompt },
        ],
        // OpenAI-style JSON mode - constrains the response to valid JSON,
        // same purpose as Gemini's responseSchema in the old client.
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.deepseek.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("DeepSeek returned an empty response.");
    return text;
  } catch (error) {
    logger.warn("DeepSeek call failed", {
      status: error.response?.status,
      message: error.message,
    });
    throw error;
  }
}