# Git branching workflow

This repo ships with a 4-branch structure so each of the 4 group members
owns a clearly separated area of the codebase, matching section 4.1
(Personnel Component Distribution) of the project proposal.

## Branches

- `main` — the integrated, always-deployable branch. Nobody commits to it
  directly; it only receives merges from feature branches.
- `feature/member1-threat-intel-integration` — Member 01: connectors to
  VirusTotal / AbuseIPDB / AlienVault OTX / Cisco Talos (stub), the IoC
  type detector, and the AI prompt-builder ("matrix readability" step).
- `feature/member2-matrix-history` — Member 02: the correlation matrix
  engine, confidence scoring, and the SQLite-backed search-history cache.
- `feature/member3-ai-synthesis` — Member 03: the Gemini client (with
  4-key rotation), and the response parser/fallback handling.
- `feature/member4-dashboard-export` — Member 04: the React dashboard and
  the PDF/CSV export services.

## Day-to-day workflow for each member

```bash
git checkout feature/memberN-your-area
git pull origin main            # bring in the latest integrated work
# ...make changes...
git add .
git commit -m "feat(memberN): description of the change"
git push origin feature/memberN-your-area
```

Then open a Pull Request from your branch into `main`. Have at least one
other member review it before merging — this is both good practice and
gives you evidence of collaborative development for your logbook.

## Why this split (not "1 branch per pipeline stage")

The proposal groups the 4 members into two natural pairs rather than one
person per pipeline stage: Members 01-02 own everything up to and
including the correlation matrix, Members 03-04 own everything from the
matrix onward. The branch names mirror that directly, so a look at
`git log --oneline --graph --all` tells the story of who built what.
Maintained by Sayuni - ai synthesis
