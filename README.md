# Peregrine — AI-Assisted Multi-Source IoC Correlation & Threat-Intelligence Dashboard

IE3092 Information Security Project — Group 03

Peregrine accepts a single Indicator of Compromise (IP, domain, file hash, or URL),
queries multiple threat-intelligence sources in parallel, normalizes and correlates
their verdicts into a single confidence-scored matrix, and passes that matrix to a
generative AI (Gemini) to produce a plain-language summary, risk rating and
threat-hunting recommendations. Repeated lookups are served instantly from a
search-history cache.

## Monorepo layout

```
peregrine/
├── backend/    Node.js + Express API (threat-intel fan-out, matrix engine, AI synthesis, exports)
└── frontend/   React + Vite dashboard (search bar, matrix table, AI summary, history, exports)
```

## Branching strategy (maps to the 4 project members)

| Branch | Owner | Scope |
|---|---|---|
| `feature/member1-threat-intel-integration` | Member 01 | Authenticated connectors to VirusTotal / AbuseIPDB / AlienVault OTX / (Talos placeholder), IoC type detection, and the prompt-builder that turns the finished matrix into the AI's input format |
| `feature/member2-matrix-history` | Member 02 | Correlation matrix engine, confidence scoring, SQLite-backed search-history cache |
| `feature/member3-ai-synthesis` | Member 03 | Gemini API client with multi-key rotation, response parsing into `{summary, riskRating, recommendations}`, fallback handling |
| `feature/member4-dashboard-export` | Member 04 | React dashboard UI, PDF report export, CSV raw-data export |

`main` is the integrated branch — it merges all four feature branches plus the
wiring (Express app, routes, middleware) that ties them together. See
`docs/BRANCHING.md` for the full git workflow.

See the setup/hosting guide provided separately in chat for step-by-step deployment.
