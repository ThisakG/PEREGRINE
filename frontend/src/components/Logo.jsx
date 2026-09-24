// =============================================================================
// Logo.jsx  (Member 04 - Result Displaying & Export Capability)
// -----------------------------------------------------------------------------
// WHAT: The brand mark shown at the top of the dashboard.
// WHY it's an inline SVG placeholder, not an <img src="/logo.png">:
//       The uploaded resource "Peregrine_logo.docx" contains no actual
//       embedded image - just the text "Peregrine logo:". Rather than
//       leave a broken <img> tag, this renders a simple falcon-inspired
//       wordmark in the app's own grayscale + green palette so the UI is
//       complete and presentable right now.
//
// TO SWAP IN THE REAL LOGO ONCE YOU HAVE THE FILE:
//   1. Drop the real file at frontend/public/logo.svg (or logo.png).
//   2. Replace the <svg>...</svg> block below with:
//        <img src="/logo.svg" alt="Peregrine" height="28" />
//   3. Also update index.html's <link rel="icon" href="/logo.svg" /> if
//      the favicon should be the same asset.
//   4. If the real logo has its own brand green, sample it and update
//      --color-accent in src/index.css (everything else updates itself).
// =============================================================================

export default function Logo() {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Peregrine logo placeholder"
    >
      {/* Simple abstracted falcon-wing chevron - swap for the real mark per the note above */}
      <path
        d="M4 34 L24 8 L44 34 L24 24 Z"
        fill="var(--color-accent)"
      />
      <circle cx="24" cy="30" r="3" fill="var(--color-text)" />
    </svg>
  );
}
