// =============================================================================
// CorrelationMatrix.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: Renders the correlation matrix built by Member 02's
//       correlationMatrix.js - one row per threat-intel source, showing
//       its verdict, reputation score, and a visual score bar. This is
//       flagged in the brief as an important component, so it deliberately
//       does more than a bare table: it visually communicates confidence
//       at a glance via the colored bar width, and clearly distinguishes
//       "queried but had nothing to say" (not_applicable/unconfigured)
//       from an actual clean/suspicious/malicious verdict, so the analyst
//       is never misled into reading "no data" as "no threat".
// =============================================================================

const UNAVAILABLE_VERDICTS = new Set(["unconfigured", "not_applicable", "error", "not_implemented"]);

function scoreBarClass(verdict) {
  if (verdict === "malicious") return "malicious";
  if (verdict === "suspicious") return "suspicious";
  return "";
}

function VerdictPill({ verdict }) {
  const known = ["clean", "suspicious", "malicious"].includes(verdict) ? verdict : "unknown";
  return <span className={`verdict-pill ${known}`}>{verdict.replace(/_/g, " ")}</span>;
}

export default function CorrelationMatrix({ matrix }) {
  return (
    <div className="card">
      <h2>Correlation Matrix</h2>
      <table className="matrix-table">
        <thead>
          <tr>
            <th>Source</th>
            <th>Verdict</th>
            <th>Reputation score</th>
          </tr>
        </thead>
        <tbody>
          {matrix.sources.map((source) => {
            const unavailable = UNAVAILABLE_VERDICTS.has(source.verdict);
            return (
              <tr key={source.source} className={unavailable ? "unavailable-row" : ""}>
                <td className="source-name">{source.source}</td>
                <td>
                  <VerdictPill verdict={source.verdict} />
                </td>
                <td>
                  {typeof source.reputationScore === "number" ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div className="score-bar-track">
                        <div
                          className={`score-bar-fill ${scoreBarClass(source.verdict)}`}
                          style={{ width: `${source.reputationScore}%` }}
                        />
                      </div>
                      <span>{source.reputationScore}</span>
                    </div>
                  ) : (
                    <span>—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <p className="cache-badge" style={{ marginTop: 14 }}>
        {matrix.sourcesResponded} of {matrix.sourcesQueried} sources responded
      </p>
    </div>
  );
}
