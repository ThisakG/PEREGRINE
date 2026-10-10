// =============================================================================
// App.jsx (integration layer - wires together all 4 members' components)
// -----------------------------------------------------------------------------
// WHAT: Top-level component. Owns the search/results state machine:
//       idle -> loading -> success | error, and loads the recent-searches
//       history panel on mount.
// =============================================================================

import { useEffect, useState } from "react";
import Logo from "./components/Logo.jsx";
import SearchBar from "./components/SearchBar.jsx";
import SummaryCard from "./components/SummaryCard.jsx";
import CorrelationMatrix from "./components/CorrelationMatrix.jsx";
import ExportButtons from "./components/ExportButtons.jsx";
import HistoryPanel from "./components/HistoryPanel.jsx";
import { lookupIoc, fetchHistory, fetchHistoryEntry } from "./services/api.js";

export default function App() {
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);
  // True only when this tab was opened from the history panel to view a
  // past reading, rather than a fresh search - purely affects the banner.
  const [isHistorical, setIsHistorical] = useState(false);

  async function refreshHistory() {
    try {
      const { history } = await fetchHistory();
      setHistory(history);
    } catch {
      // History panel is non-critical; fail silently.
    }
  }

  // On first load, check whether this tab was opened as a historical view
  // (?historyId=123, set by HistoryPanel's "open in new tab").
  useEffect(() => {
    const historyId = new URLSearchParams(window.location.search).get("historyId");
    if (historyId) {
      setIsLoading(true);
      fetchHistoryEntry(historyId)
        .then((data) => {
          setResult(data);
          setIsHistorical(true);
        })
        .catch((err) => setError(err.message))
        .finally(() => setIsLoading(false));
    } else {
      refreshHistory();
    }
  }, []);

  async function handleSearch(iocValue) {
    setIsLoading(true);
    setError(null);
    setIsHistorical(false);
    try {
      const data = await lookupIoc(iocValue);
      setResult(data);
      refreshHistory();
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <div className="brand">
        <Logo />
      </div>

      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <p className="loading-text">Querying threat-intelligence sources…</p>}

      {isHistorical && result && !isLoading && (
        <div
          className="error-banner"
          style={{ borderColor: "var(--color-accent)", background: "var(--color-accent-muted)", color: "var(--color-text)" }}
        >
          Viewing a saved reading from {new Date(result.createdAt).toLocaleString()} — this is a historical
          snapshot, not live data. Search above for a fresh, current reading to compare against it.
        </div>
      )}

      {result && !isLoading && (
        <div className="results">
          <SummaryCard ioc={result.ioc} matrix={result.matrix} ai={result.ai} />
          <CorrelationMatrix matrix={result.matrix} />
          <div className="card">
            <h2>Export</h2>
            <ExportButtons historyId={result.id} />
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="results">
          <HistoryPanel items={history} />
        </div>
      )}
    </div>
  );
}
