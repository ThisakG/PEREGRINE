// =============================================================================
// exportRoutes.js  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: PDF and CSV export endpoints. Both re-run the SAME cache lookup as
//       /api/ioc/lookup (rather than trusting a matrix blob posted from the
//       frontend) so an export always reflects the authoritative,
//       server-stored result for that IoC - never client-supplied data
//       that could be tampered with before being turned into a PDF/CSV.
// =============================================================================

import { Router } from "express";
import { validateIocBody } from "../middleware/validateIoc.js";
import { findCachedResult } from "../services/matrix/historyStore.js";
import { buildCsvExport } from "../services/export/csvExport.js";
import { streamPdfExport } from "../services/export/pdfExport.js";

export const exportRouter = Router();

function loadCachedOrFail(req, res) {
  const cached = findCachedResult(req.validatedIoc);
  if (!cached) {
    res.status(404).json({ error: "No stored result for this IoC yet - run a lookup first." });
    return null;
  }
  return cached;
}

exportRouter.post("/pdf", validateIocBody, (req, res) => {
  const cached = loadCachedOrFail(req, res);
  if (!cached) return;
  streamPdfExport(res, req.validatedIoc, cached.matrix, cached.ai);
});

exportRouter.post("/csv", validateIocBody, (req, res) => {
  const cached = loadCachedOrFail(req, res);
  if (!cached) return;
  const csv = buildCsvExport(req.validatedIoc, cached.matrix);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="peregrine-raw-${req.validatedIoc.type}-${Date.now()}.csv"`
  );
  res.send(csv);
});
