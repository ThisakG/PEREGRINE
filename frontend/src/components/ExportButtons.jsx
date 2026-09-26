// =============================================================================
// ExportButtons.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: The two export actions from the proposal - a formatted PDF report,
//       and a CSV of the raw multi-source data (which deliberately
//       bypasses the AI layer - see backend/services/export/csvExport.js).
// =============================================================================

import { useState } from "react";
import { downloadExport } from "../services/api.js";

export default function ExportButtons({ ioc }) {
  const [busy, setBusy] = useState(null);

  async function handleExport(format) {
    setBusy(format);
    try {
      await downloadExport(ioc, format);
    } catch (err) {
      // Export failures are non-critical to the main flow, so we just
      // surface a lightweight alert here rather than a page-level error
      // banner - the analyst's results are still fully visible either way.
      alert(`Export failed: ${err.message}`);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="export-buttons">
      <button onClick={() => handleExport("pdf")} disabled={busy !== null}>
        {busy === "pdf" ? "Generating PDF…" : "Export PDF report"}
      </button>
      <button onClick={() => handleExport("csv")} disabled={busy !== null}>
        {busy === "csv" ? "Generating CSV…" : "Export raw CSV"}
      </button>
    </div>
  );
}
