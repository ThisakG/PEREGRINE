// =============================================================================
// virusTotal.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Authenticated connector to the VirusTotal v3 API - the project's
//       mandatory source #1 (per the proposal's specific objectives).
// WHY these design choices:
//   - The API key is sent via the "x-apikey" header (VT's documented auth
//     method), never as a query string parameter, so it can't end up
//     logged in access logs or browser history anywhere along the chain.
//   - A hard request timeout stops one slow provider from hanging the
//     whole /api/ioc/lookup request indefinitely.
//   - Every VT-specific field name lives ONLY in this file. Nothing outside
//     this file should ever know VT calls its verdict "last_analysis_stats"
//     - that's exactly what normalize() exists to hide, so the correlation
//       matrix engine (Member 02) can treat every source identically.
// =============================================================================

import axios from "axios";
import { logger } from "../../utils/logger.js";

const BASE_URL = "https://www.virustotal.com/api/v3";
const REQUEST_TIMEOUT_MS = 8000;

// VT uses a different URL path per IoC type - map it here once.
function endpointFor(ioc) {
  switch (ioc.type) {
    case "ip":
      return `/ip_addresses/${encodeURIComponent(ioc.value)}`;
    case "domain":
      return `/domains/${encodeURIComponent(ioc.value)}`;
    case "hash":
      return `/files/${encodeURIComponent(ioc.value)}`;
    case "url": {
      // VT identifies URLs by a base64url SHA-256-free "url id" derived
      // from the URL itself. We submit the URL for a lookup-by-id using
      // VT's documented base64url(url) identifier scheme.
      const urlId = Buffer.from(ioc.value)
        .toString("base64")
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
      return `/urls/${urlId}`;
    }
    default:
      throw new Error(`Unsupported IoC type for VirusTotal: ${ioc.type}`);
  }
}

/**
 * Normalizes VirusTotal's response shape into the common intermediate
 * schema every source in this project returns, so the correlation matrix
 * engine never has to know which provider a field came from.
 *
 * Common schema:
 *  { source, available, verdict, maliciousCount, totalEngines, reputationScore, raw }
 */
function normalize(rawResponse) {
  const stats = rawResponse?.data?.attributes?.last_analysis_stats;
  if (!stats) {
    return {
      source: "VirusTotal",
      available: false,
      verdict: "unknown",
      maliciousCount: 0,
      totalEngines: 0,
      reputationScore: null,
      raw: rawResponse?.data ?? null,
    };
  }

  const malicious = stats.malicious ?? 0;
  const suspicious = stats.suspicious ?? 0;
  const totalEngines =
    malicious + suspicious + (stats.harmless ?? 0) + (stats.undetected ?? 0);

  let verdict = "clean";
  if (malicious > 0) verdict = "malicious";
  else if (suspicious > 0) verdict = "suspicious";

  const attrs = rawResponse?.data?.attributes ?? {};
  const context = {};
  if (attrs.as_owner) context.networkOwner = attrs.as_owner;
  if (attrs.country) context.country = attrs.country;
  if (attrs.registrar) context.registrar = attrs.registrar;
  if (attrs.creation_date) context.domainCreated = new Date(attrs.creation_date * 1000).toISOString().slice(0, 10);
  if (attrs.type_description) context.fileType = attrs.type_description;
  if (attrs.meaningful_name) context.fileName = attrs.meaningful_name;
  if (attrs.title) context.pageTitle = attrs.title;

  return {
    source: "VirusTotal",
    available: true,
    verdict,
    maliciousCount: malicious + suspicious,
    totalEngines,
    reputationScore: totalEngines > 0 ? Math.round((malicious / totalEngines) * 100) : null,
    context,
    raw: rawResponse.data,
  };
}

/**
 * @param {{type: string, value: string}} ioc  - already validated by iocDetector.js
 * @param {string} apiKey
 */
export async function lookupVirusTotal(ioc, apiKey) {
  if (!apiKey) {
    return { source: "VirusTotal", available: false, verdict: "unconfigured" };
  }
  try {
    const response = await axios.get(`${BASE_URL}${endpointFor(ioc)}`, {
      headers: { "x-apikey": apiKey },
      timeout: REQUEST_TIMEOUT_MS,
    });
    return normalize(response.data);
  } catch (error) {
    // A 404 from VT just means "not seen before" - that is a valid,
    // informative result, not a failure, so we return "unknown" rather
    // than bubbling an exception up and losing the other sources' data.
    if (error.response?.status === 404) {
      return { source: "VirusTotal", available: true, verdict: "unknown", maliciousCount: 0, totalEngines: 0, reputationScore: null, raw: null };
    }
    logger.warn("VirusTotal lookup failed", { status: error.response?.status, message: error.message });
    return { source: "VirusTotal", available: false, verdict: "error" };
  }
}
