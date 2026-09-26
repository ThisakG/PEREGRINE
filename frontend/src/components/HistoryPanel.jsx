// =============================================================================
// HistoryPanel.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: Shows recently investigated IoCs (backed by Member 02's
//       GET /api/ioc/history) and lets the analyst re-open one with a
//       click, which re-triggers a lookup that resolves instantly from
//       cache on the backend.
// =============================================================================

function VerdictDot({ verdict }) {
  const known = ["clean", "suspicious", "malicious"].includes(verdict) ? verdict : "unknown";
  return (
    <span
      style={{ display: "inline-block", width: 8, height: 8, borderRadius: "50%", marginRight: 8, background: `var(--color-${known})` }}
    />
  );
}

export default function HistoryPanel({ items }) {
  if (!items || items.length === 0) return null;

  function openInNewTab(id) {
    const url = new URL(window.location.href);
    url.search = `?historyId=${id}`;
    window.open(url.toString(), "_blank", "noopener,noreferrer");
  }

  return (
    <div className="card">
      <h2>Recent searches</h2>
      <ul className="history-list">
        {items.map((item) => (
          <li key={item.id} className="history-item" onClick={() => openInNewTab(item.id)}>
            <span>
              <VerdictDot verdict={item.overallVerdict} />
              <span className="ioc-value">{item.iocValue}</span>
            </span>
            <span className="score-label">{item.consolidatedConfidenceScore ?? "—"}/100 · opens in new tab ↗</span>
          </li>
        ))}
      </ul>
    </div>
  );
}