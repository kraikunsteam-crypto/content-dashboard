# VS Code + GitHub + Google Sheets API Project

This repository is set up as a starter workspace for a project that uses:

- VS Code for local development
- GitHub for source control
- Google Sheets as a lightweight early-stage database
- A middle-layer API so the frontend never talks to Google Sheets directly

Read the project brief in [agent.md](agent.md), then read
[RUNBOOK.md](RUNBOOK.md) for the current operating steps. For a concise
machine-to-machine continuation note, read [HANDOFF.md](HANDOFF.md).

Current app prototype:

```text
content-dashboard/
```

It contains a VS Code-runnable dashboard inspired by the Content OS demo UI.
The frontend calls a local API route first and never connects to Google Sheets
directly.

## Start Here

When reopening this folder in a new Codex/Claude/VS Code session:

1. Read [agent.md](agent.md).
2. Read [RUNBOOK.md](RUNBOOK.md).
3. If working with AGT skills, read [AGT_SKILLS.md](AGT_SKILLS.md).
4. If rerunning the Facebook competitor scan, use the steps in
   [RUNBOOK.md](RUNBOOK.md).
5. If running the dashboard, open `content-dashboard/` and run:

```powershell
.\run-dashboard.ps1
```

Then open:

```text
http://localhost:5177
```

## Current Dashboard

The dashboard lives in:

```text
content-dashboard/
```

Status:

```text
Advanced Content Analysis Dashboard prototype
```

It is analysis-ready for the current local scan data: KPI, Top 5 trending
content, Hook vault, next content ideas, recent post table, metric confidence,
and source post buttons are already included.

Main files:

- `index.html` - dashboard UI
- `styles.css` - visual styling
- `app.js` - frontend rendering and analysis logic
- `server.mjs` - local API/static server
- `run-dashboard.ps1` - PowerShell runner that uses Node.js when available,
  otherwise starts a local PowerShell fallback preview server
- `data/sample-facebook-scan.json` - portable sample data
- `README.md` - dashboard-specific instructions

Local API routes:

- `GET /api/health`
- `GET /api/dashboard`
- `POST /api/sync` placeholder for Google Sheets sync

Dashboard UI includes KPI overview, Top 5 trending content, competitor cards,
Hook vault, suggested content ideas, recent posts, and buttons that open the
source Facebook posts.

## GitHub Pages Deploy

This project includes a GitHub Actions workflow for GitHub Pages:

```text
.github/workflows/deploy-pages.yml
```

The deployed static dashboard uses `content-dashboard/data/sample-facebook-scan.json`.
Live URL:

```text
https://kraikunsteam-crypto.github.io/content-dashboard/
```

GitHub repository:

```text
https://github.com/kraikunsteam-crypto/content-dashboard
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for deploy and push notes.

## AGT Skills

The full AGT Skill Pack is bundled under:

```text
.claude/skills/
```

See [AGT_SKILLS.md](AGT_SKILLS.md) for the installed skill list and setup notes.

## Use On Another Machine

Clone this repository, or download and extract:

```text
agt-skill-pack-all.zip
```

Then copy the bundled skills into another project if needed:

Windows PowerShell:

```powershell
.\install-agt-skills.ps1 -Destination "C:\path\to\other\project"
```

Bash:

```bash
bash ./install-agt-skills.sh /path/to/other/project
```

## Security Rule

Keep Google credentials and Sheet access behind the API layer. Do not expose
service account keys, API keys, Sheet IDs, or private Apps Script URLs in
frontend code.

## Database Rule

Use Google Sheets as the MVP database:

- Source tabs hold rows that automation reads from.
- Output tabs are updated with upsert logic.
- Existing rows are updated by stable keys; new rows are appended.
- Historical rows are preserved unless deletion is explicitly requested.
- The frontend only talks to the backend API, never directly to Sheets.

For this dashboard, `server.mjs` is the API boundary. Later, replace the local
JSON read with Google Sheets read/write and keep the frontend API call the same.
