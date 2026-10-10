// =============================================================================
// groqClient.js  (Member 03 - AI Parsing & Output Generation)
// -----------------------------------------------------------------------------
// WHAT: Calls Groq's OpenAI-compatible chat completions endpoint.
// WHY: Genuinely free (rate-limited, not balance-limited) - no billing
// setup required, unlike DeepSeek. Same request/response shape as
// deepseekClient.js since both are OpenAI-compatible, just a different
// base URL, key, and model name.
// =============================================================================

import axios from "axios";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const REQUEST_TIMEOUT_MS = 20000;

export async function callGroq(prompt) {
  if (!env.groq.apiKey) {
    throw new Error("No Groq API key configured.");
  }

  try {
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: env.groq.model,
        messages: [
          { role: "system", content: prompt.systemInstructions },
          { role: "user", content: prompt.userPrompt },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${env.groq.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: REQUEST_TIMEOUT_MS,
      }
    );

    const text = response.data?.choices?.[0]?.message?.content;
    if (!text) throw new Error("Groq returned an empty response.");
    return text;
  } catch (error) {
    logger.warn("Groq call failed", {
      status: error.response?.status,
      message: error.message,
    });
    throw error;
  }
}