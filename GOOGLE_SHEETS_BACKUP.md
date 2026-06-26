# Google Sheets Backup Database

Use the existing backup Sheet. Do not create a new one unless the user asks.

## Target Sheet

```text
Facebook Competitor Content Scan - 2026-06-25
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

Config file:

```text
config/google-sheets-backup.json
```

## Data Flow

```text
outputs/facebook-content-scan/cleaned_posts.json
-> content-dashboard/googleSheetsBackup.mjs
-> scripts/sync-google-sheets-backup.mjs or POST /api/sync
-> existing Google Sheet tabs
-> Dashboard charts
```

## Tabs

- `Backup Meta` - sync metadata, source links, deploy links, counts.
- `Channel Summary` - one row per competitor page/channel.
- `Posts` - post-level fact table.
- `Chart Data` - compact numeric table for charts.
- `Method Notes` - audit and metric-confidence notes.
- `Dashboard` - chart display and backup status.

## Local Payload Build

From repo root:

```powershell
node scripts/sync-google-sheets-backup.mjs --dry-run
```

Without a webhook URL, the script writes:

```text
outputs/google-sheets-backup/backup-payload.json
```

That output folder is ignored by git because it is generated.

## Live Writeback

Preferred write paths:

- Apps Script webhook with `GOOGLE_SHEETS_BACKUP_WEBHOOK_URL`.
- Google Sheets connector, if the current session can read/write the Sheet.

1. Open the existing backup Sheet.
2. Add or open Apps Script.
3. Paste `google-sheets/backup-webhook-apps-script.gs`.
4. Deploy it as a Web App.
5. Set the Web App URL in the server environment:

```powershell
$env:GOOGLE_SHEETS_BACKUP_WEBHOOK_URL = "<Apps Script web app URL>"
```

6. Run:

```powershell
node scripts/sync-google-sheets-backup.mjs
```

or call:

```text
POST http://localhost:5177/api/sync
```

If the Google Drive/Sheets connector reports an MCP handshake timeout, do not
create a new Sheet as a workaround. Reconnect the connector or use the Apps
Script webhook against the existing Sheet.

## Security Rules

- Do not commit `.env`, service account files, webhook URLs, cookies, API keys,
  or private Apps Script URLs.
- Keep Google credentials on the server/worker side.
- The frontend must never read or write Google Sheets directly.

## Documentation Rule

After every sync or database schema change, update:

- `RUN_READY.md`
- `HANDOFF.md`
- `RUNBOOK.md`
- this file
