// =============================================================================
// pdfExport.js  (Member 04 - Result Displaying & Export Capability,
//                built in collaboration with Member 02's matrix and
//                Member 03's AI synthesis, as noted in the proposal)
// -----------------------------------------------------------------------------
// WHAT: Renders a single IoC lookup (matrix + AI summary) as a formatted
//       PDF report the analyst can save or attach to a ticket.
// WHY PDFKit and a stream (not a template-to-HTML-to-PDF pipeline):
//       PDFKit generates the PDF programmatically and streams it directly
//       to the HTTP response - no headless browser, no temp files written
//       to disk that would then need cleanup, which keeps the backend's
//       attack surface and dependency footprint smaller.
// =============================================================================

import PDFDocument from "pdfkit";

const RISK_COLORS = {
  low: "#2ecc71",
  medium: "#f1c40f",
  high: "#e67e22",
  critical: "#e74c3c",
};

/**
 * Streams a PDF report directly to an Express response object.
 * @param {import('express').Response} res
 * @param {{type:string,value:string}} ioc
 * @param {object} matrix
 * @param {object|null} ai
 */
export function streamPdfExport(res, ioc, matrix, ai) {
  const doc = new PDFDocument({ margin: 50 });

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="peregrine-report-${ioc.type}-${Date.now()}.pdf"`
  );
  doc.pipe(res);

  doc.fontSize(20).fillColor("#1a1a1a").text("Peregrine Threat Intelligence Report", { align: "left" });
  doc.moveDown(0.5);
  doc.fontSize(10).fillColor("#666666").text(`Generated ${new Date().toLocaleString()}`);
  doc.moveDown(1.5);

  doc.fontSize(13).fillColor("#1a1a1a").text(`IoC: ${ioc.value}`);
  doc.fontSize(10).fillColor("#666666").text(`Type: ${ioc.type.toUpperCase()}`);
  doc.moveDown(1);

  doc.fontSize(13).fillColor("#1a1a1a").text(
    `Overall verdict: ${matrix.overallVerdict.toUpperCase()}   |   Confidence score: ${
      matrix.consolidatedConfidenceScore ?? "N/A"
    }/100`
  );
  doc.moveDown(1);

  // --- Correlation matrix table -------------------------------------
  doc.fontSize(13).fillColor("#1a1a1a").text("Correlation Matrix", { underline: true });
  doc.moveDown(0.5);
  for (const source of matrix.sources) {
    doc
      .fontSize(10)
      .fillColor("#333333")
      .text(
        `${source.source.padEnd(18)}  verdict: ${source.verdict.padEnd(12)}  score: ${
          source.reputationScore ?? "N/A"
        }`
      );
  }
  doc.moveDown(1.5);

  // --- AI synthesis (optional - may be null per the fallback path) ---
  if (ai) {
    doc.fontSize(13).fillColor("#1a1a1a").text("AI Threat Intelligence Summary", { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(10).fillColor("#333333").text(ai.summary, { align: "left" });
    doc.moveDown(0.5);
    doc
      .fontSize(11)
      .fillColor(RISK_COLORS[ai.riskRating] ?? "#333333")
      .text(`Risk rating: ${ai.riskRating.toUpperCase()}`);
    doc.moveDown(0.5);
    doc.fontSize(11).fillColor("#1a1a1a").text("Recommended threat-hunting actions:");
    ai.recommendations.forEach((rec, i) => {
      doc.fontSize(10).fillColor("#333333").text(`${i + 1}. ${rec}`);
    });
  } else {
    doc
      .fontSize(10)
      .fillColor("#999999")
      .text("AI synthesis was unavailable for this lookup - showing raw correlation matrix only.");
  }

  doc.end();
}
