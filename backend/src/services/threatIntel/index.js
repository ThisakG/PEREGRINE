// =============================================================================
// services/threatIntel/index.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Fans a single validated IoC out to every configured threat-intel
//       source IN PARALLEL and collects their normalized results.
// WHY Promise.allSettled (not Promise.all):
//       If VirusTotal is down but AbuseIPDB and OTX both answer, the
//       analyst should still get a 2-source correlation matrix instead of
//       the whole request failing because ONE provider had a bad moment.
//       Each connector already catches its own errors and returns an
//       { available: false, verdict: "error" } object rather than
//       throwing, but allSettled is a second layer of the same
//       resilience principle in case a connector ever throws unexpectedly.
// =============================================================================

import { lookupVirusTotal } from "./virusTotal.js";
import { lookupAbuseIPDB } from "./abuseIPDB.js";
import { lookupOtx } from "./alienVaultOtx.js";
import { logger } from "../../utils/logger.js";

/**
 * @param {{type: string, value: string}} ioc - pre-validated by iocDetector.js
 * @param {object} keys - env.threatIntel from config/env.js
 * @returns {Promise<Array<object>>} array of normalized per-source results
 */
export async function queryAllSources(ioc, keys) {
  const tasks = [
    lookupVirusTotal(ioc, keys.virusTotalApiKey),
    lookupAbuseIPDB(ioc, keys.abuseIpdbApiKey),
    lookupOtx(ioc, keys.otxApiKey),
  ];

  const settled = await Promise.allSettled(tasks);

  return settled.map((result, index) => {
    if (result.status === "fulfilled") return result.value;
    // A connector threw instead of returning its own error object - log it
    // and degrade gracefully with a generic "error" entry so one bad
    // source can never take down the whole correlation matrix.
    const sourceNames = ["VirusTotal", "AbuseIPDB", "AlienVault OTX"];
    logger.error("Threat-intel connector threw unexpectedly", {
      source: sourceNames[index],
      reason: String(result.reason),
    });
    return { source: sourceNames[index], available: false, verdict: "error" };
  });
}
