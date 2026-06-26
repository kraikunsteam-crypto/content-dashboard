# Machine Handoff Summary

## Purpose

This folder is a portable VS Code/GitHub project for a content intelligence
dashboard that uses Google Sheets as the MVP database through an API boundary.

Core rule:

```text
Frontend -> API / worker -> Google Sheets
```

The frontend must never connect to Google Sheets directly and must never expose
Google credentials, private Sheet IDs, Apps Script private URLs, service account
keys, API keys, cookies, or browser private data.

## Read Order For A New Machine Or Agent

1. `README.md` - top-level project entry point.
2. `agent.md` - project brief, architecture rules, and Google Sheets database
   principles.
3. `RUNBOOK.md` - current operating steps, source spreadsheet, scan workflow,
   latest delivered report, and next production steps.
4. `HANDOFF.md` - this concise continuation summary.
5. `content-dashboard/README.md` - dashboard-specific run notes.
6. `AGT_SKILLS.md` - only if transferring or using the bundled AGT skills.

## Current Project State

Current runnable prototype:

```text
content-dashboard/
```

Status:

```text
Advanced Content Analysis Dashboard prototype
```

The dashboard already has KPI cards, Top 5 trending posts, competitor cards,
hook extraction, next content ideas, recent post table, metric confidence, and
source Facebook post buttons.

Current dashboard display reads local JSON/static JSON, and the existing Google
Sheet below is the database/backup target for scan outputs and charts.

GitHub repository:

```text
https://github.com/kraikunsteam-crypto/content-dashboard
```

GitHub Pages live dashboard:

```text
https://kraikunsteam-crypto.github.io/content-dashboard/
```

Existing Google Sheets database/backup:

```text
Facebook Competitor Content Scan - 2026-06-25
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

Do not create a new backup spreadsheet unless the user explicitly asks. Treat
this Sheet as the database/backup target for competitor page updates.

GitHub Pages deployment files:

```text
.github/workflows/deploy-pages.yml
DEPLOYMENT.md
```

Current deployment status:

```text
Deployed successfully through GitHub Actions run 28223941633.
Latest pushed commit: fa525aa Enable Pages during deployment.
Branch main tracks origin/main.
```

## Runtime Flow

Run from the dashboard folder:

```powershell
cd content-dashboard
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

Execution sequence:

1. `content-dashboard/run-dashboard.ps1` looks for `node` in PATH.
2. If Node is not in PATH, it tries the Codex bundled runtime under the current
   user's `.cache` folder.
3. If neither Node path exists, the runner starts a local PowerShell fallback
   preview server.
4. With Node available, the runner starts `content-dashboard/server.mjs`.
5. The active server serves static files and API routes on port `5177` by
   default.
6. Browser loads `index.html`, `styles.css`, and `app.js`.
7. `app.js` calls `GET /api/dashboard`.
8. The API server tries to read:

```text
outputs/facebook-content-scan/cleaned_posts.json
```

9. If that file is missing, the API server falls back to:

```text
content-dashboard/data/sample-facebook-scan.json
```

10. `app.js` computes dashboard metrics in the browser and renders KPI, insights,
   topic mix, Top 5 posts, brand cards, hooks, ideas, and recent post rows.
11. If `/api/dashboard` is unavailable, `app.js` falls back directly to:

```text
content-dashboard/data/sample-facebook-scan.json
```

## API Routes

Current local server routes:

- `GET /api/health` - health check.
- `GET /api/dashboard` - returns dashboard JSON from latest local scan output or
  sample fallback.
- `POST /api/sync` - Node server route that sends the latest payload to the
  existing backup Sheet when `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` is configured.
  Without that env var it returns `503` with the target spreadsheet URL.

Keep the frontend pointed at these API routes even after the backend switches
from local JSON to Google Sheets.

## Google Sheets Backup Sync Files

- `config/google-sheets-backup.json` - canonical existing Sheet ID, URL, source
  Sheet, tab names, stable keys, and dashboard URL.
- `content-dashboard/googleSheetsBackup.mjs` - builds tab payloads for `Backup
  Meta`, `Channel Summary`, `Posts`, `Chart Data`, and `Method Notes`.
- `scripts/sync-google-sheets-backup.mjs` - CLI sync helper. It writes
  `outputs/google-sheets-backup/backup-payload.json` when no webhook is set, or
  POSTs to Google Sheets when `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` is set.
- `google-sheets/backup-webhook-apps-script.gs` - Apps Script web app template
  to paste/deploy against the existing backup Sheet.
- `.env.example` - documents the webhook env var without storing secrets.

## Facebook Scan And Report Flow

Source Google Sheet:

```text
https://docs.google.com/spreadsheets/d/1OVD3rwNVyT02ZfaUiNxtPh8V3KA9mvXkAQ6dyAhb4Zo/edit?gid=1497181589#gid=1497181589
```

Source tab:

```text
11A_Channel_Link_Library
```

For the current Facebook scan, filter source rows where:

```text
Platform = Facebook
Platform Code = FB
```

Current Facebook channels are `CH-001` through `CH-010`.

Local scan chunks:

```text
outputs/facebook-content-scan/facebook_chunk_0_5.json
outputs/facebook-content-scan/facebook_chunk_5_5.json
```

Workbook/report builder:

```text
outputs/facebook-content-scan/build_report.mjs
```

Run the builder from the repository root. On the original machine the command
was:

```powershell
& "C:\Users\Kraik\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "outputs\facebook-content-scan\build_report.mjs"
```

On another machine, use that machine's Node.js or bundled Codex Node.js path.

Builder sequence:

1. Read the two current chunk JSON files.
2. Infer visible or partly inferable public engagement metrics.
3. Deduplicate posts by `channel_id + post_url`.
4. Build brand summaries.
5. Create a workbook with tabs:
   - `Dashboard`
   - `Channel Summary`
   - `Posts`
   - `Method Notes`
6. Render dashboard preview PNG.
7. Export XLSX.
8. Write cleaned JSON for the dashboard API.

Generated local outputs:

```text
outputs/facebook-content-scan/facebook_competitor_content_scan.xlsx
outputs/facebook-content-scan/dashboard_preview.png
outputs/facebook-content-scan/cleaned_posts.json
outputs/facebook-content-scan/workbook_inspect.ndjson
outputs/facebook-content-scan/facebook_competitor_content_scan.xlsx.inspect.ndjson
```

Latest delivered Google Sheet report:

```text
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

Title:

```text
Facebook Competitor Content Scan - 2026-06-25
```

Latest summary from the runbook:

- Pages scanned: 10
- Recent posts found after cleanup: 14
- Active brands: 6
- Visible reactions: 505
- Comments captured or inferred: 22
- Shares captured or inferred: 24
- Top active brand: Dreammy
- Top visible reaction post: Dreammy, 408 reactions

## Data Quality Rules

Facebook public pages may hide or obfuscate exact engagement counts.

Use these confidence labels:

- `public_visible` - metric was visible directly in public text.
- `partial_inferred` - metric was inferred only from nearby unlabeled public
  Facebook text.
- blank/null - value was not visible or not safe to infer.

Do not fabricate missing reactions, comments, or shares.

For official reporting, connect Meta Graph API, Meta Business Suite export, or
another approved authenticated export in the backend/API layer.

## Google Sheets Database Contract

Treat Google Sheets tabs as MVP database tables:

- `11A_Channel_Link_Library` - source/channel rows.
- `Posts` - post-level fact table.
- `Channel Summary` - derived brand/channel summary.
- `Method Notes` - audit and data quality notes.

Automation should:

1. Read source rows from Google Sheets.
2. Filter active rows by platform/status.
3. Fetch or scan public/approved source data.
4. Normalize rows.
5. Upsert by stable keys.
6. Preserve history unless deletion is explicitly requested.
7. Return clean JSON through the API for the dashboard.

Stable key preference:

```text
channel_id + post_url
```

Fallback key:

```text
channel_id + post_date + caption
```

## Important Files

- `README.md` - high-level entry point.
- `agent.md` - project brief and principles.
- `RUNBOOK.md` - detailed operating runbook.
- `PROJECT_SUMMARY.md` - shorter existing summary.
- `AGT_SKILLS.md` - bundled skill-pack overview.
- `content-dashboard/server.mjs` - API boundary and static server.
- `content-dashboard/app.js` - frontend dashboard logic.
- `content-dashboard/index.html` - dashboard markup.
- `content-dashboard/styles.css` - dashboard styling.
- `content-dashboard/run-dashboard.ps1` - local runner; uses Node when
  available and falls back to a PowerShell preview server when Node is missing.
- `content-dashboard/data/sample-facebook-scan.json` - portable fallback data.
- `outputs/facebook-content-scan/build_report.mjs` - report builder.
- `outputs/facebook-content-scan/cleaned_posts.json` - current dashboard data.

## Required Documentation Habit

Every future scan, sync, deploy, schema change, or database target change must
update:

- `RUN_READY.md` - short handoff for the next machine/agent.
- `HANDOFF.md` - detailed current state and caveats.
- `RUNBOOK.md` - operating sequence.
- `DEPLOYMENT.md` - only when GitHub Pages/deploy changes.

## Known Caveats

- Live Google Sheets writeback requires either the Apps Script webhook URL in
  `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` or a working Google Sheets connector
  session.
- In the current session, the Google Drive/Sheets connector returned an MCP
  handshake timeout, so the live Sheet was not updated through the connector.
  The generated payload path and Apps Script webhook path are ready.
- The current local dashboard can run without Google credentials because
  display still reads local JSON or static JSON fallback.
- Runtime paths under `C:\Users\Kraik\.cache\...` are machine-specific.
- Some Thai text in dashboard source files appears mojibake in the current
  checked-in files. If polishing the UI, restore those strings from a clean Thai
  source or rewrite them deliberately in UTF-8.
- Exact Facebook metrics should not be treated as official until connected to
  approved Meta data sources.

## Recommended Next Work

1. Keep the frontend API contract stable: `GET /api/dashboard`.
2. Keep `content-dashboard/server.mjs` as the API boundary.
3. Use `POST /api/sync` or `scripts/sync-google-sheets-backup.mjs` to back up
   scan output into the existing Google Sheet.
4. Store credentials only in environment variables or server-side secret
   storage.
5. Upsert scan results into output tabs instead of blindly overwriting.
6. Add scheduling for recurring scans.
7. Move exact metrics to Meta Graph API or approved export when available.
8. Keep dashboard rendering logic separate from the storage implementation so
   the project can later migrate from Google Sheets to PostgreSQL, Supabase,
   Firebase, or another database without changing the frontend.
