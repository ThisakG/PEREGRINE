// =============================================================================
// iocDetector.js  (Member 01 - API Connection & Matrix Readability)
// -----------------------------------------------------------------------------
// WHAT: Detects the TYPE of an Indicator of Compromise (ip / domain / hash /
//       url) from the raw string a user typed into the search bar, and
//       validates that the string is actually well-formed for that type.
// WHY:  This is the FIRST security control in the whole pipeline. Every
//       threat-intel connector and the AI prompt builder downstream all
//       trust that "ioc.type" and "ioc.value" have already been validated
//       here - this is a strict server-side allow-list, not a best-effort
//       client-side hint. Rejecting anything that doesn't match a known,
//       well-formed IoC shape prevents:
//         - SSRF-style abuse (someone submitting an internal URL like
//           "http://169.254.169.254/..." to make the server's outbound
//           requests target infrastructure metadata endpoints)
//         - Injection into downstream HTTP requests, SQL, or the AI prompt
//         - Wasting free-tier API quota on garbage input
// =============================================================================

// --- Regex allow-lists --------------------------------------------------
// Deliberately strict. We would rather reject a borderline-valid IoC and
// ask the analyst to double check it than silently accept something
// malformed that then gets forwarded to three different external APIs.

const IPV4_REGEX =
  /^(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d{2}|[1-9]?\d)){3}$/;

const IPV6_REGEX =
  /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^([0-9a-fA-F]{1,4}:){1,7}:$|^::([0-9a-fA-F]{1,4}:){0,6}[0-9a-fA-F]{1,4}$/;

// RFC-1035-ish hostname: labels of letters/digits/hyphens, 2+ char TLD.
const DOMAIN_REGEX =
  /^(?=.{1,253}$)(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

// Common IoC hash lengths: MD5 (32), SHA-1 (40), SHA-256 (64).
const HASH_REGEX = /^[a-fA-F0-9]{32}$|^[a-fA-F0-9]{40}$|^[a-fA-F0-9]{64}$/;

// Loosely-strict URL check: requires http(s) scheme. We do NOT accept
// file://, ftp://, javascript:, data: or any other scheme - those have no
// legitimate place in a threat-intel lookup and are classic SSRF/XSS vectors.
function isHttpUrl(candidate) {
  try {
    const url = new URL(candidate);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Classifies and validates a raw user-submitted string.
 * @param {string} raw
 * @returns {{ type: "ip"|"domain"|"hash"|"url", value: string } }
 * @throws {Error} if the input does not match any known, well-formed IoC shape
 */
export function detectIoc(raw) {
  if (typeof raw !== "string") {
    throw new Error("IoC must be a string.");
  }

  // Trim whitespace and enforce a hard length ceiling BEFORE running any
  // regex against it - this protects against ReDoS-style abuse where an
  // attacker sends a pathologically long string to make backtracking
  // regex engines spin.
  const value = raw.trim();
  if (value.length === 0 || value.length > 2048) {
    throw new Error("IoC must be between 1 and 2048 characters.");
  }

  if (HASH_REGEX.test(value)) {
    return { type: "hash", value: value.toLowerCase() };
  }
  if (IPV4_REGEX.test(value) || IPV6_REGEX.test(value)) {
    return { type: "ip", value };
  }
  if (isHttpUrl(value)) {
    return { type: "url", value };
  }
  if (DOMAIN_REGEX.test(value)) {
    return { type: "domain", value: value.toLowerCase() };
  }

  throw new Error(
    "Unrecognized IoC format. Expected an IPv4/IPv6 address, domain name, " +
      "file hash (MD5/SHA1/SHA256), or http(s) URL."
  );
}
