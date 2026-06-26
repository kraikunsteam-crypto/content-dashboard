# Run-Ready Handoff

This file is the shortest continuation note for another machine or agent.

## Current Status

Local app is runnable and GitHub Pages is deployed.

Repository:

```text
https://github.com/kraikunsteam-crypto/content-dashboard
```

Live dashboard:

```text
https://kraikunsteam-crypto.github.io/content-dashboard/
```

Verified locally:

```text
GET http://localhost:5177/ -> 200
GET http://localhost:5177/api/health -> 200
GET http://localhost:5177/api/dashboard -> 200
```

Verified deployed:

```text
GET https://kraikunsteam-crypto.github.io/content-dashboard/ -> 200
```

Existing Google Sheets database/backup:

```text
Facebook Competitor Content Scan - 2026-06-25
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

## Run Locally

From the repository root:

```powershell
cd content-dashboard
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

## Data Source

Local API route:

```text
GET /api/dashboard
```

Read order:

```text
outputs/facebook-content-scan/cleaned_posts.json
content-dashboard/data/sample-facebook-scan.json
```

GitHub Pages has no server API, so it uses:

```text
content-dashboard/data/sample-facebook-scan.json
```

## Google Sheets Backup Sync

Config:

```text
config/google-sheets-backup.json
```

Apps Script template:

```text
google-sheets/backup-webhook-apps-script.gs
```

Local sync command:

```powershell
node scripts/sync-google-sheets-backup.mjs
```

If `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` is not set, the script only builds:

```text
outputs/google-sheets-backup/backup-payload.json
```

When the webhook URL is set, the script updates the existing backup Sheet tabs:

```text
Backup Meta
Channel Summary
Posts
Chart Data
Method Notes
Dashboard
```

`Dashboard` is rebuilt with charts from `Chart Data`.

## Deployment

Workflow:

```text
.github/workflows/deploy-pages.yml
```

Deploy is triggered by:

```text
git push origin main
```

Current branch:

```text
main tracks origin/main
```

If Git reports dubious ownership on Windows, use:

```powershell
git -c safe.directory="E:/New folder (3)" status
git -c safe.directory="E:/New folder (3)" push
```

## Not Done Yet

- Live writeback needs `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL` or a working Google
  Sheets connector session.
- Exact Facebook metrics require an approved Meta/API/export source.

Current session note: the Google Drive/Sheets connector returned an MCP
handshake timeout, so live writeback was not performed through the connector in
this run. The repo-side payload and Apps Script webhook path are ready.

## Documentation Rule

After each run, scan, sync, deploy, or database change, update this file plus
`HANDOFF.md` and `RUNBOOK.md`.
