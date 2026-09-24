// =============================================================================
// api.js  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: The single fetch wrapper every component uses to talk to the
//       backend - no component ever calls fetch() directly.
// WHY:
//   - One place to point at VITE_API_BASE_URL, so switching from local dev
//     to the deployed backend is a single .env change, not a find-replace
//     across components.
//   - This file contains ZERO API keys. The frontend never talks to
//     VirusTotal/AbuseIPDB/OTX/Gemini directly - only to Peregrine's own
//     backend, which holds every secret server-side. This is the concrete
//     implementation of "never ship secrets to the browser".
// =============================================================================

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });

  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${response.status})`);
  }
  return response;
}

export async function lookupIoc(ioc) {
  const res = await request("/api/ioc/lookup", {
    method: "POST",
    body: JSON.stringify({ ioc }),
  });
  return res.json();
}

export async function fetchHistory(limit = 20) {
  const res = await request(`/api/ioc/history?limit=${limit}`);
  return res.json();
}

export async function downloadExport(ioc, format) {
  const res = await request(`/api/export/${format}`, {
    method: "POST",
    body: JSON.stringify({ ioc }),
  });
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `peregrine-${format}-${Date.now()}.${format}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
}
