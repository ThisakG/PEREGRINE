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
    <img
      src="/logoo.png"
      alt="Peregrine"
      height="180"
    />
  );
}
