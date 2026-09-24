// =============================================================================
// csvExport.js  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: Exports the raw multi-source JSON for an IoC as CSV, deliberately
//       bypassing the AI layer entirely (per the proposal: "an export of
//       source data rather than its interpretation").
// WHY the escapeCsvField() function matters (secure-coding note):
//       This is a defense against "CSV injection" / "formula injection".
//       If a threat-intel source's raw metadata ever contained a string
//       starting with =, +, -, or @ (e.g. a malicious domain's WHOIS
//       registrant name deliberately crafted as "=cmd|'/c calc'!A1"),
//       opening the exported CSV in Excel/Sheets could execute it as a
//       formula. Prefixing such fields with a single quote neutralizes
//       that without changing the visible content for normal values.
// =============================================================================

function escapeCsvField(value) {
  let str = value === null || value === undefined ? "" : String(value);

  // Neutralize formula-injection trigger characters at the start of a field.
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }

  // Standard CSV quoting: wrap in quotes and escape embedded quotes if the
  // field contains a comma, quote, or newline.
  if (/[",\n]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function toCsvRow(fields) {
  return fields.map(escapeCsvField).join(",") + "\r\n";
}

/**
 * @param {{type:string,value:string}} ioc
 * @param {object} matrix - output of correlationMatrix.js
 * @returns {string} CSV text
 */
export function buildCsvExport(ioc, matrix) {
  const header = [
    "ioc_type",
    "ioc_value",
    "source",
    "available",
    "verdict",
    "reputation_score",
    "malicious_count",
    "total_engines",
  ];

  let csv = toCsvRow(header);
  for (const source of matrix.sources) {
    csv += toCsvRow([
      ioc.type,
      ioc.value,
      source.source,
      source.available,
      source.verdict,
      source.reputationScore,
      source.maliciousCount,
      source.totalEngines,
    ]);
  }
  return csv;
}
