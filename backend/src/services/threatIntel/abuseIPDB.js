// =============================================================================
// abuseIPDB.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Connector to AbuseIPDB - one of the two "optional additional
//       sources" named in the proposal (section 3.1). AbuseIPDB only scores
//       IP addresses, so this connector short-circuits for every other
//       IoC type rather than making a call that could never succeed.
// WHY:  Same reasoning as virusTotal.js re: header-based auth, timeouts and
//       normalization - see that file's comments for the general pattern.
// =============================================================================

import axios from "axios";
import { logger } from "../../utils/logger.js";

const BASE_URL = "https://api.abuseipdb.com/api/v2/check";
const REQUEST_TIMEOUT_MS = 8000;

function normalize(rawData) {
  const score = rawData?.abuseConfidenceScore ?? null;
  let verdict = "clean";
  if (score === null) verdict = "unknown";
  else if (score >= 75) verdict = "malicious";
  else if (score >= 25) verdict = "suspicious";

  const context = {};
  if (rawData?.isp) context.isp = rawData.isp;
  if (rawData?.usageType) context.usageType = rawData.usageType;
  if (rawData?.countryCode) context.country = rawData.countryCode;
  if (rawData?.domain) context.associatedDomain = rawData.domain;

  return {
    source: "AbuseIPDB",
    available: true,
    verdict,
    maliciousCount: rawData?.totalReports ?? 0,
    totalEngines: null,
    reputationScore: score,
    context,
    raw: rawData,
  };
}

/**
 * @param {{type: string, value: string}} ioc
 * @param {string} apiKey
 */
export async function lookupAbuseIPDB(ioc, apiKey) {
  if (!apiKey) {
    return { source: "AbuseIPDB", available: false, verdict: "unconfigured" };
  }
  // AbuseIPDB's public "check" endpoint only accepts IP addresses - for any
  // other IoC type we deliberately skip the call (this is a scope
  // limitation of the provider, not an error condition).
  if (ioc.type !== "ip") {
    return { source: "AbuseIPDB", available: false, verdict: "not_applicable" };
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: { ipAddress: ioc.value, maxAgeInDays: 90 },
      headers: { Key: apiKey, Accept: "application/json" },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return normalize(response.data?.data);
  } catch (error) {
    logger.warn("AbuseIPDB lookup failed", { status: error.response?.status, message: error.message });
    return { source: "AbuseIPDB", available: false, verdict: "error" };
  }
}
