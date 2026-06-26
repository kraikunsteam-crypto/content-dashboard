# Content Dashboard

This folder contains the runnable dashboard app.

Runtime contract:

```text
Frontend -> local API server -> data source
```

The frontend must not connect to Google Sheets directly. Keep Google credentials,
Sheet IDs, Apps Script private URLs, service account keys, API keys, cookies,
and browser private data out of frontend code.

## Run Locally

From this folder:

```powershell
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

The runner uses Node.js when available. If Node.js is not installed and the
Codex bundled Node path is unavailable, it starts a PowerShell fallback server
with the same URL and API routes.

## API Routes

- `GET /api/health` - server health check.
- `GET /api/dashboard` - dashboard JSON.
- `POST /api/sync` - syncs to the existing Google Sheets backup when
  `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` is configured.

## Data Source

The API first tries:

```text
../outputs/facebook-content-scan/cleaned_posts.json
```

If that file is missing, it falls back to:

```text
data/sample-facebook-scan.json
```

## Existing Google Sheets Backup

Backup/database Sheet:

```text
Facebook Competitor Content Scan - 2026-06-25
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

Config:

```text
../config/google-sheets-backup.json
```

Node sync route:

```text
POST /api/sync
```

CLI sync helper from repo root:

```powershell
node scripts/sync-google-sheets-backup.mjs
```

Live writeback requires:

```text
GOOGLE_SHEETS_BACKUP_WEBHOOK_URL
```

On GitHub Pages, there is no local API server. The frontend automatically uses:

```text
data/sample-facebook-scan.json
```

## Live Deploy

GitHub Pages:

```text
https://kraikunsteam-crypto.github.io/content-dashboard/
```

Repository:

```text
https://github.com/kraikunsteam-crypto/content-dashboard
```

## UI Sections

The dashboard is an advanced content analysis prototype. It includes:

- KPI overview.
- Current attention points.
- Top 5 trending posts.
- Competitor cards.
- Hook vault.
- Next content ideas.
- Recent posts table.
- Source post buttons.
- Metric confidence notes.
- Database contract panel.

## Production Notes

For production reporting, keep writing to the existing backup Sheet unless the
user asks for a new file. Exact official metrics still require Meta Graph API,
Meta Business Suite export, or another approved data source.
