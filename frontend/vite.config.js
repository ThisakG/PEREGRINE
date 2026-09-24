// =============================================================================
// vite.config.js
// -----------------------------------------------------------------------------
// Standard Vite + React setup. No custom proxy is configured here on
// purpose - the frontend always talks to the backend via the explicit,
// full VITE_API_BASE_URL (see services/api.js), which keeps local dev and
// production behave identically rather than relying on a dev-only proxy
// that would mask CORS issues until deployment.
// =============================================================================
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
