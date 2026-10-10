// =============================================================================
// SummaryCard.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: Renders the overall verdict/confidence score plus, when available,
//       Member 03's AI-generated plain-language summary and recommended
//       threat-hunting actions.
// WHY it renders gracefully with ai=null:
//       Per the proposal's Stage 5 fallback behavior, the AI call can fail
//       while the matrix is still perfectly valid - this component is the
//       visible proof that the fallback path works, showing a clear
//       "AI summary unavailable" note instead of a blank space or a crash.
// =============================================================================

function VerdictPill({ verdict }) {
  const known = ["clean", "suspicious", "malicious"].includes(verdict) ? verdict : "unknown";
  return <span className={`verdict-pill ${known}`}>{verdict}</span>;
}

export default function SummaryCard({ ioc, matrix, ai }) {
  return (
    <div className="card">
      <h2>Overview</h2>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 16, marginBottom: 6 }}>{ioc.value}</div>
          <VerdictPill verdict={matrix.overallVerdict} />
        </div>
        <div className="score-row">
          <span className="score-number">{matrix.consolidatedConfidenceScore ?? "—"}</span>
          <span className="score-label">/ 100 confidence</span>
        </div>
      </div>

      <div style={{ marginTop: 18 }}>
                {ai ? (
          <>
            <span className="score-label" style={{ display: "block", marginBottom: 4 }}>Background</span>
            <p className="summary-text" style={{ marginBottom: 16 }}>{ai.background}</p>
            <span className="score-label" style={{ display: "block", marginBottom: 4 }}>Threat assessment</span>
            <p className="summary-text">{ai.summary}</p>
            <div style={{ margin: "12px 0" }}>
              <span className="score-label" style={{ marginRight: 8 }}>AI risk rating:</span>
              <VerdictPill verdict={ai.riskRating === "low" ? "clean" : ai.riskRating === "medium" ? "suspicious" : "malicious"} />
              <span style={{ marginLeft: 8, textTransform: "capitalize" }}>{ai.riskRating}</span>
            </div>
            <span className="score-label">Recommended threat-hunting actions:</span>
            <ul className="recommendations">
              {ai.recommendations.map((rec, i) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </>
        ) : (
          <p className="summary-text" style={{ color: "var(--color-text-muted)" }}>
            AI synthesis is unavailable for this lookup — showing the raw correlation matrix only.
          </p>
        )}
      </div>
    </div>
  );
}
