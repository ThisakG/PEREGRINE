// =============================================================================
// iocRoutes.js (integration layer)
// -----------------------------------------------------------------------------
// UPDATED: /lookup no longer short-circuits on a cache hit. Every search
// now always re-queries every threat-intel source and re-runs AI synthesis,
// and is always saved as a NEW row - so re-investigating an IoC produces a
// fresh, independent reading rather than replaying an old one. Older
// readings remain in history for comparison (see historyStore.js).
// =============================================================================

import { Router } from "express";
import { validateIocBody } from "../middleware/validateIoc.js";
import { lookupLimiter } from "../middleware/rateLimiter.js";
import { queryAllSources } from "../services/threatIntel/index.js";
import { buildCorrelationMatrix } from "../services/matrix/correlationMatrix.js";
import { insertResult, updateAiForRow, getRecent, findById } from "../services/matrix/historyStore.js";
import { synthesizeAiSummary } from "../services/ai/responseParser.js";
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

export const iocRouter = Router();

iocRouter.post("/lookup", lookupLimiter, validateIocBody, async (req, res, next) => {
  const ioc = req.validatedIoc;

  try {
    const sourceResults = await queryAllSources(ioc, env.threatIntel);
    const matrix = buildCorrelationMatrix(ioc, sourceResults);

    // Insert immediately so this reading is safely recorded even if the
    // AI step below fails.
    const id = insertResult(ioc, matrix, null);

    const ai = await synthesizeAiSummary(ioc, matrix);
    if (ai) updateAiForRow(id, ai);

    res.json({ id, ioc, matrix, ai, generatedAt: new Date().toISOString() });
  } catch (error) {
    next(error);
  }
});

// Recent-readings list for the history panel.
iocRouter.get("/history", (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 20, 100);
    res.json({ history: getRecent(limit) });
  } catch (error) {
    next(error);
  }
});

// A single historical reading, opened by the history panel in a new tab.
iocRouter.get("/history/:id", (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: "Invalid history id." });
    }
    const record = findById(id);
    if (!record) return res.status(404).json({ error: "No history entry with that id." });
    res.json(record);
  } catch (error) {
    next(error);
  }
});