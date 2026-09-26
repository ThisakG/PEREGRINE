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
import { lookupIoc, fetchHistory } from "./services/api.js";

export default function App() {
  const [result, setResult] = useState(null); // { ioc, matrix, ai, fromCache, cachedAt }
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  async function refreshHistory() {
    try {
      const { history } = await fetchHistory();
      setHistory(history);
    } catch {
      // History is a nice-to-have panel, not core to the search flow -
      // fail silently here rather than showing an error banner for it.
    }
  }

  useEffect(() => {
    refreshHistory();
  }, []);

  async function handleSearch(iocValue) {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lookupIoc(iocValue);
      setResult(data);
      refreshHistory(); // the new/refreshed lookup should appear at the top of history
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
        <div>
          <h1>Peregrine</h1>
          <div className="tagline">Multi-source IoC correlation & AI threat intelligence</div>
        </div>
      </div>

      <SearchBar onSearch={handleSearch} isLoading={isLoading} />

      {error && <div className="error-banner">{error}</div>}
      {isLoading && <p className="loading-text">Querying threat-intelligence sources…</p>}

      {result && !isLoading && (
        <div className="results">
          <SummaryCard
            ioc={result.ioc}
            matrix={result.matrix}
            ai={result.ai}
            fromCache={result.fromCache}
            cachedAt={result.cachedAt}
          />
          <CorrelationMatrix matrix={result.matrix} />
          <div className="card">
            <h2>Export</h2>
            <ExportButtons ioc={result.ioc} />
          </div>
        </div>
      )}

      {!result && !isLoading && (
        <div className="results">
          <HistoryPanel items={history} onSelect={handleSearch} />
        </div>
      )}
    </div>
  );
}
