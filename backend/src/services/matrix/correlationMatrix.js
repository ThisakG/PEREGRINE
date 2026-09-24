// =============================================================================
// correlationMatrix.js  (Member 02 - Matrix Creation & Search History)
// -----------------------------------------------------------------------------
// WHAT: Takes the array of normalized per-source results (from
//       services/threatIntel/index.js) and aligns them into the single
//       correlation matrix described throughout the proposal: each
//       source's verdict/reputation-score/metadata side by side, plus one
//       consolidated confidence score for the IoC as a whole.
// WHY a WEIGHTED average rather than a plain average:
//       Sources that return "not_applicable" / "unconfigured" / "error"
//       genuinely have no opinion and must NOT be allowed to silently drag
//       the consolidated score toward 0 - that would make an IoC look
//       artificially safer just because one optional source wasn't
//       configured. Only sources that both responded AND produced a
//       numeric reputationScore are counted.
// =============================================================================

const VERDICT_WEIGHT = { clean: 0, suspicious: 1, malicious: 2 };

/**
 * @param {{type:string, value:string}} ioc
 * @param {Array<object>} sourceResults - output of queryAllSources()
 * @returns {object} the correlation matrix
 */
export function buildCorrelationMatrix(ioc, sourceResults) {
  const usableResults = sourceResults.filter(
    (r) => r.available && typeof r.reputationScore === "number"
  );

  const consolidatedConfidenceScore =
    usableResults.length > 0
      ? Math.round(
          usableResults.reduce((sum, r) => sum + r.reputationScore, 0) / usableResults.length
        )
      : null;

  // Overall verdict is driven by the MOST SEVERE verdict among sources that
  // actually responded, not an average of verdict labels (labels aren't
  // numbers) - "if even one credible source says malicious, don't average
  // that away" is a deliberate, conservative security posture.
  const respondingVerdicts = sourceResults
    .filter((r) => r.available && r.verdict in VERDICT_WEIGHT)
    .map((r) => r.verdict);

  let overallVerdict = "unknown";
  if (respondingVerdicts.length > 0) {
    overallVerdict = respondingVerdicts.reduce((worst, v) =>
      VERDICT_WEIGHT[v] > VERDICT_WEIGHT[worst] ? v : worst
    , "clean");
  }

  return {
    ioc,
    generatedAt: new Date().toISOString(),
    sources: sourceResults, // full per-source rows - this IS the "matrix" the UI renders as a table
    consolidatedConfidenceScore, // 0-100, or null if no source produced a usable score
    overallVerdict, // "clean" | "suspicious" | "malicious" | "unknown"
    sourcesQueried: sourceResults.length,
    sourcesResponded: sourceResults.filter((r) => r.available).length,
  };
}
