// =============================================================================
// exportRoutes.js  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// UPDATED: exports now operate on a specific reading by its numeric
// database id, not by re-sending the IoC value. This is both the fix for
// the "Request body must include an ioc string field" bug (the frontend
// was sending the IoC as an object, not a string) and the correct design
// once an IoC can have multiple readings - exporting "by IoC value" would
// be ambiguous about which reading to use. The frontend always knows the
// id of whatever result is currently on screen, so it sends that directly.
// =============================================================================

import { Router } from "express";
import { findById } from "../services/matrix/historyStore.js";
import { buildCsvExport } from "../services/export/csvExport.js";
import { streamPdfExport } from "../services/export/pdfExport.js";

export const exportRouter = Router();

function loadRecordOrFail(req, res) {
  const id = Number(req.body?.historyId);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'Request body must include a numeric "historyId" field.' });
    return null;
  }
  const record = findById(id);
  if (!record) {
    res.status(404).json({ error: "No stored result found for that id." });
    return null;
  }
  return record;
}

exportRouter.post("/pdf", (req, res) => {
  const record = loadRecordOrFail(req, res);
  if (!record) return;
  streamPdfExport(res, record.ioc, record.matrix, record.ai);
});

exportRouter.post("/csv", (req, res) => {
  const record = loadRecordOrFail(req, res);
  if (!record) return;
  const csv = buildCsvExport(record.ioc, record.matrix);
  res.setHeader("Content-Type", "text/csv");
  res.setHeader("Content-Disposition", `attachment; filename="peregrine-raw-${record.ioc.type}-${Date.now()}.csv"`);
  res.send(csv);
});