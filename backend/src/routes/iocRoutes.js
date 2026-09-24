// =============================================================================
// iocRoutes.js (integration layer - orchestrates all 4 members' modules)
// -----------------------------------------------------------------------------
// WHAT: The core endpoint, POST /api/ioc/lookup, implementing the exact
//       pipeline described in the proposal's System Architecture (section
//       3.2 / Figure 3.2):
//         1. Input validation (middleware, Member 01's detector)
//         2. History check (Member 02's cache) - short-circuits on a hit
//         3. Multi-source API fan-out (Member 01)
//         4. Correlation & scoring (Member 02) + persist to history
//         5. GenAI interpretation (Member 03) + persist AI result
//         6. Response returned for the dashboard to render (Member 04)
// =============================================================================

import { Router } from "express";
import { validateIocBody } from "../middleware/validateIoc.js";
import { lookupLimiter } from "../middleware/rateLimiter.js";
import { queryAllSources } from "../services/threatIntel/index.js";
import { buildCorrelationMatrix } from "../services/matrix/correlationMatrix.js";
import { findCachedResult, saveResult, getRecent } from "../services/matrix/historyStore.js";
import { synthesizeAiSummary } from "../services/ai/responseParser.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const iocRouter = Router();

iocRouter.post("/lookup", lookupLimiter, validateIocBody, async (req, res, next) => {
  const ioc = req.validatedIoc;

  try {
    // --- Stage 2: History check (cache hit short-circuits stages 3-5) ---
    const cached = findCachedResult(ioc);
    if (cached) {
      logger.info("Cache hit - serving stored result", { type: ioc.type });
      return res.json({
        ioc,
        matrix: cached.matrix,
        ai: cached.ai,
        fromCache: true,
        cachedAt: cached.cachedAt,
      });
    }

    // --- Stage 3: Multi-source API fan-out ---
    const sourceResults = await queryAllSources(ioc, env.threatIntel);

    // --- Stage 4: Correlation & scoring, then persist ---
    const matrix = buildCorrelationMatrix(ioc, sourceResults);
    saveResult(ioc, matrix, null); // save matrix immediately so it's cached even if the AI step below fails

    // --- Stage 5: GenAI interpretation (never throws - see responseParser.js) ---
    const ai = await synthesizeAiSummary(ioc, matrix);
    if (ai) saveResult(ioc, matrix, ai); // update the cached row now that AI is available too

    // --- Stage 6: Response for the dashboard ---
    res.json({ ioc, matrix, ai, fromCache: false, cachedAt: null });
  } catch (error) {
    next(error); // handled centrally by middleware/errorHandler.js
  }
});

// Powers the dashboard's "recent searches" history panel.
iocRouter.get("/history", (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ history: getRecent(limit) });
  } catch (error) {
    next(error);
  }
});
