// =============================================================================
// alienVaultOtx.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Connector to AlienVault OTX (Open Threat Exchange) - the second
//       "optional additional source" named in the proposal. OTX supports
//       IP, domain, hostname, URL and file-hash lookups via its
//       "indicators" endpoint, so unlike AbuseIPDB this connector is
//       usable for every IoC type Peregrine accepts.
// WHY:  Same pattern as the other connectors - see virusTotal.js for the
//       full rationale on timeouts/headers/normalization.
// =============================================================================

import axios from "axios";
import { logger } from "../../utils/logger.js";

const BASE_URL = "https://otx.alienvault.com/api/v1/indicators";
const REQUEST_TIMEOUT_MS = 8000;

function sectionFor(ioc) {
  switch (ioc.type) {
    case "ip":
      return `/IPv4/${encodeURIComponent(ioc.value)}/general`;
    case "domain":
      return `/domain/${encodeURIComponent(ioc.value)}/general`;
    case "hash":
      return `/file/${encodeURIComponent(ioc.value)}/general`;
    case "url":
      return `/url/${encodeURIComponent(ioc.value)}/general`;
    default:
      throw new Error(`Unsupported IoC type for OTX: ${ioc.type}`);
  }
}

function normalize(rawData) {
  // OTX's signal is "how many community pulses (threat reports) reference
  // this indicator" rather than a per-engine verdict. We translate pulse
  // count into the same clean/suspicious/malicious verdict scale used
  // across all sources so the correlation matrix can compare them directly.
  const pulseCount = rawData?.pulse_info?.count ?? 0;
  let verdict = "clean";
  if (pulseCount >= 5) verdict = "malicious";
  else if (pulseCount >= 1) verdict = "suspicious";

  return {
    source: "AlienVault OTX",
    available: true,
    verdict,
    maliciousCount: pulseCount,
    totalEngines: null,
    // Cap the derived score at 100 for a consistent 0-100 scale with the
    // other sources, using a simple diminishing-returns style formula.
    reputationScore: Math.min(100, pulseCount * 15),
    raw: rawData,
  };
}

/**
 * @param {{type: string, value: string}} ioc
 * @param {string} apiKey
 */
export async function lookupOtx(ioc, apiKey) {
  if (!apiKey) {
    return { source: "AlienVault OTX", available: false, verdict: "unconfigured" };
  }
  try {
    const response = await axios.get(`${BASE_URL}${sectionFor(ioc)}`, {
      headers: { "X-OTX-API-KEY": apiKey },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return normalize(response.data);
  } catch (error) {
    if (error.response?.status === 404) {
      return { source: "AlienVault OTX", available: true, verdict: "unknown", maliciousCount: 0, totalEngines: null, reputationScore: null, raw: null };
    }
    logger.warn("OTX lookup failed", { status: error.response?.status, message: error.message });
    return { source: "AlienVault OTX", available: false, verdict: "error" };
  }
}
