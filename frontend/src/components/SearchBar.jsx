// =============================================================================
// SearchBar.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: The big central search bar - the focal point of the whole
//       dashboard per the brief ("really simple front end with a nice big
//       search bar in the center").
// WHY client-side trimming only (no client-side regex validation beyond
// that):
//       The AUTHORITATIVE IoC validation lives server-side in
//       middleware/validateIoc.js -> utils/iocDetector.js. Duplicating
//       strict validation here would just be UX sugar that could drift out
//       of sync with the real rules; instead we trim whitespace (cheap,
//       obviously safe) and let the backend be the single source of truth,
//       surfacing its error message verbatim if it rejects the input.
// =============================================================================

import { useState } from "react";

export default function SearchBar({ onSearch, isLoading }) {
  const [value, setValue] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || isLoading) return;
    onSearch(trimmed);
  }

  return (
    <form className="search-shell" onSubmit={handleSubmit}>
      <div className="search-bar">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter an IP address, domain, file hash, or URL…"
          autoFocus
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading || !value.trim()}>
          {isLoading ? "Searching…" : "Investigate"}
        </button>
      </div>
      <p className="search-hint">
        Supports IPv4/IPv6, domains, MD5/SHA-1/SHA-256 hashes, and http(s) URLs.
      </p>
    </form>
  );
}
