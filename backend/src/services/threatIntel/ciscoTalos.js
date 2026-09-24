// =============================================================================
// ciscoTalos.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Placeholder connector for Cisco Talos, which the project proposal
//       (section 2.2, Specific Objectives) names as one of the two
//       mandatory sources alongside VirusTotal.
// WHY THIS IS A STUB, NOT A LIVE CALL:
//   Cisco Talos does not currently offer a self-service, free-tier
//   reputation-lookup API comparable to VirusTotal's. Its Talos
//   Intelligence API requires a commercial/enterprise agreement, and no
//   key for it was provided in this project's credentials. Talos.
//   IMPORTANT: flag this deviation explicitly in the final report/logbook
//   (Software Stack Submission - "Best practices & standards" /
//   Final Report - "Technology" sections) so the module's decision is
//   documented, e.g.: "Talos was substituted with AbuseIPDB and AlienVault
//   OTX as the two additional correlated sources because Talos requires
//   enterprise licensing not available to a student project."
//
// HOW TO ACTIVATE THIS FOR REAL, if/when a key is obtained:
//   1. Add CISCO_TALOS_API_KEY to backend/.env (see .env.example).
//   2. Replace the body of lookupCiscoTalos() below with a real axios call
//      to Talos's documented endpoint, following the exact same pattern as
//      virusTotal.js: normalize the response into
//      { source, available, verdict, maliciousCount, totalEngines,
//        reputationScore, raw }.
//   3. Add lookupCiscoTalos to the Promise.allSettled fan-out in
//      services/threatIntel/index.js - no other file needs to change,
//      because every downstream consumer (the matrix engine, the AI
//      prompt builder) only ever depends on the common normalized schema.
// =============================================================================

export async function lookupCiscoTalos(_ioc, apiKey) {
  if (!apiKey) {
    return { source: "Cisco Talos", available: false, verdict: "unconfigured" };
  }
  // Reaching here means CISCO_TALOS_API_KEY was set but this module has not
  // been implemented against a real endpoint yet - surface that plainly
  // rather than silently pretending to have queried Talos.
  return { source: "Cisco Talos", available: false, verdict: "not_implemented" };
}
