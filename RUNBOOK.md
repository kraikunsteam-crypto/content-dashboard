# Project Runbook

Read this file first when reopening this folder in Codex, Claude, VS Code, or
another machine.

## Current Goal

Build and operate a workflow that uses:

- VS Code as the local project workspace
- GitHub for source control and sharing to other machines
- Google Sheets as a lightweight editable database
- A middle-layer API so the frontend never talks to Google Sheets directly
- Browser/Chrome-assisted research only as a data collection helper

Core rule:

```text
Frontend / App -> Backend API or Apps Script API -> Google Sheets
```

Never expose Google credentials, service account keys, private Sheet IDs, or
private Apps Script URLs in frontend code.

## Important Files

- `agent.md` - project brief and architecture rules
- `README.md` - quick setup overview
- `AGT_SKILLS.md` - installed AGT skill list
- `.claude/skills/` - bundled AGT skills
- `install-agt-skills.ps1` - install bundled skills into another project on Windows
- `install-agt-skills.sh` - install bundled skills into another project on Bash
- `agt-skill-pack-all.zip` - portable archive for another machine
- `outputs/facebook-content-scan/` - latest Facebook competitor scan artifacts
- `outputs/facebook-content-scan/build_report.mjs` - workbook builder for the scan report
- `content-dashboard/` - runnable local dashboard prototype
- `content-dashboard/server.mjs` - API/static server for the dashboard
- `content-dashboard/data/sample-facebook-scan.json` - portable sample dashboard data

## Source Google Sheet

Main workbook:

```text
https://docs.google.com/spreadsheets/d/1OVD3rwNVyT02ZfaUiNxtPh8V3KA9mvXkAQ6dyAhb4Zo/edit?gid=1497181589#gid=1497181589
```

Relevant tab:

```text
11A_Channel_Link_Library
```

Useful columns in that tab:

- `Link ID`
- `Product`
- `Competitor Brand`
- `Platform`
- `Platform Code`
- `URL`
- `Link Status`
- `Channel Type`
- `Priority`
- `Owner`
- `Check Frequency`
- `Used For`

For the Facebook scan, filter rows where:

```text
Platform = Facebook
Platform Code = FB
```

## Google Sheets As The Database

Treat Google Sheets as the working database for this MVP.

Database tables are represented by tabs:

- `11A_Channel_Link_Library` is the channel/source table.
- Scan output sheets such as `Posts` are fact tables.
- `Channel Summary` is a derived summary table.
- `Method Notes` is an audit/source table.

Rules:

1. Every row that drives automation should have a stable ID, such as
   `Link ID`, `Channel ID`, `Post URL`, or another unique key.
2. Automation must read rows from Google Sheets, decide what is active, and
   update output tables from those rows.
3. Use upsert logic, not blind overwrite:
   - If a row with the same key exists, update that row.
   - If the key is new, append a new row.
   - Do not delete historical rows unless the user explicitly asks.
4. Keep raw/source data separate from calculated dashboard data.
5. Keep status fields such as `Last Checked`, `Next Check`, `Scan Status`,
   `Metric Confidence`, and `Metric Note` so later runs can continue where the
   previous run stopped.
6. The frontend must never read or write Google Sheets directly.
7. The app/backend/API layer is responsible for:
   - reading Google Sheets rows
   - validating rows
   - fetching or scanning external data
   - writing updates back to Google Sheets
   - returning clean JSON to the frontend

Target app architecture:

```text
Frontend -> API routes / worker -> Google Sheets database tabs
```

This keeps the Sheet useful as a human-editable database while still allowing a
future migration to PostgreSQL, Supabase, Firebase, or another database.

Current Facebook channels from the source tab:

| Channel ID | Product | Brand | URL |
| --- | --- | --- | --- |
| CH-001 | Mister Save | B - one | https://www.facebook.com/mintana2018/?locale=th_TH |
| CH-002 | Mister Save | Dreammy | https://www.facebook.com/CoffeeDreamyTH/?locale=th_TH |
| CH-003 | Mister Save | Nestle | https://www.facebook.com/NestleThailand/ |
| CH-004 | Mister Save | BuddyDean | https://www.facebook.com/BuddyDeanThailand |
| CH-005 | ChaoThai | Chaokoh | https://www.facebook.com/CHAOKOH.TH/?locale=th_TH |
| CH-006 | ChaoThai | AroyD | https://www.facebook.com/AroyDCoconutMilk/?locale=th_TH |
| CH-007 | ChaoThai | REALTHAI | https://www.facebook.com/realthaicoconutmilk/?locale=th_TH |
| CH-008 | COJIN | HOTTA | https://www.facebook.com/HottaGingerExpert/ |
| CH-009 | COJIN | GINGEN | https://www.facebook.com/gingenthailand/?locale=th_TH |
| CH-010 | COJIN | RANONG | https://www.facebook.com/Ranong.TH/ |

## Latest Delivered Output

Created Google Sheet:

```text
https://docs.google.com/spreadsheets/d/1yLVgZ-Ghe8ADDNaVtBno49f2Wky-fIFrxqaGCTqujeI/edit
```

Title:

```text
Facebook Competitor Content Scan - 2026-06-25
```

Tabs:

- `Dashboard`
- `Channel Summary`
- `Posts`
- `Method Notes`

Latest scan summary:

- Pages scanned: 10
- Recent posts found after cleanup: 14
- Active brands: 6
- Visible reactions: 505
- Comments captured or inferred: 22
- Shares captured or inferred: 24
- Top active brand: Dreammy
- Top visible reaction post: Dreammy, 408 reactions

## How To Re-run The Facebook Scan

1. Read `agent.md`, `README.md`, and this `RUNBOOK.md`.
2. Use the Google Drive / Google Sheets connector to read metadata from the
   source spreadsheet.
3. Confirm tab `11A_Channel_Link_Library` exists.
4. Read a bounded range such as `A1:Z60` first, then identify the Facebook rows.
5. Treat each Facebook source row as a database record. Use `Link ID` and URL as
   stable source keys.
6. Use Browser or Chrome to inspect Facebook pages.
7. Prefer Chrome when the user explicitly asks to use their Chrome session.
8. If Chrome desktop Facebook renders feed metadata as skeletons or split
   accessibility text, use the extraction path that provides stable public
   timestamp/caption text.
9. Do not inspect cookies, local storage, passwords, session stores, or browser
   private data.
10. Collect only public-visible post fields:
   - page/channel ID
   - product
   - brand
   - post date or Facebook time label
   - post type
   - caption / post summary
   - reactions if visible
   - comments if visible or clearly inferable
   - shares if visible or clearly inferable
   - post URL
   - page URL
   - raw public text
   - data quality note
11. Do not fabricate missing engagement numbers.
12. If comments/shares are not labeled clearly, leave blank or mark as
    `partial_inferred` only when the raw public text makes the inference clear.
13. Upsert output rows by a stable key:
    - preferred key: `channel_id + post_url`
    - fallback key: `channel_id + post_date + caption`
14. Save raw chunk JSON files under:

```text
outputs/facebook-content-scan/
```

Current chunk files:

```text
outputs/facebook-content-scan/facebook_chunk_0_5.json
outputs/facebook-content-scan/facebook_chunk_5_5.json
```

15. Run the workbook builder:

```powershell
& "C:\Users\Kraik\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" "outputs\facebook-content-scan\build_report.mjs"
```

The builder creates:

```text
outputs/facebook-content-scan/facebook_competitor_content_scan.xlsx
outputs/facebook-content-scan/dashboard_preview.png
outputs/facebook-content-scan/cleaned_posts.json
outputs/facebook-content-scan/workbook_inspect.ndjson
```

16. Visually inspect `dashboard_preview.png`.
17. Import the `.xlsx` as a native Google Sheets spreadsheet using Google Drive
    import with `upload_mode = native_google_sheets`.
18. Read back metadata and a few key ranges from the created Google Sheet:
    - `Dashboard!A1:H23`
    - `Posts!A1:P16`

For a future recurring run, prefer updating the same output database spreadsheet
with upserts instead of creating a new spreadsheet every time, unless the user
asks for a fresh report copy.

## Data Quality Rules

Facebook public pages do not always expose full engagement counts in stable
labeled fields.

Use these labels:

- `public_visible` - the value was visible directly in public text
- `partial_inferred` - the value was inferred from nearby unlabeled public
  engagement text
- blank/null - the value was not visible or not safe to infer

Always include a `Metric Note` column explaining limitations.

Production recommendation:

```text
Use Meta Graph API, Meta Business Suite export, or an authenticated approved export for exact official metrics.
```

## Dashboard Shape

Follow the reference UI idea from:

```text
https://tinataylor-stack.github.io/products/content_dashboard_demo.html
```

Current dashboard status:

```text
Advanced Content Analysis Dashboard prototype
```

Use a stakeholder-friendly analysis shape:

- KPI cards at the top
- `What to notice` section with short observations and actions
- `Top 5 Content` section ranked by reactions + comments + shares
- `Top Recent Posts`
- source post buttons so the user can open Facebook posts directly
- Hook vault for reusable opening angles
- suggested next content ideas based on the observed content mix
- detailed `Posts` tab for auditability
- `Channel Summary` tab for brand-level performance
- `Method Notes` tab for sources, limits, and next steps

This is the current "analysis-ready" dashboard state. The next production step
is not more UI; it is connecting `/api/dashboard` and `/api/sync` to real
Google Sheets read/write plus official Meta metrics where available.

## Runnable Dashboard Prototype

The local app is in:

```text
content-dashboard/
```

Run from VS Code:

```powershell
cd content-dashboard
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

The app contains:

- `index.html` - dashboard UI
- `styles.css` - layout and styling
- `app.js` - frontend analysis/rendering logic
- `server.mjs` - API boundary and static server
- `run-dashboard.ps1` - PowerShell runner that finds Node.js
- `data/sample-facebook-scan.json` - copied seed data for portable demo runs

Frontend behavior:

1. Try `GET /api/dashboard`.
2. If the API is unavailable, fallback to `data/sample-facebook-scan.json`.
3. Render KPI, Top 5 trending content, competitor cards, hooks, content ideas,
   recent posts, and source post buttons.

Backend/API behavior:

1. `GET /api/dashboard` reads the latest local scan output from
   `outputs/facebook-content-scan/cleaned_posts.json`.
2. If that file is unavailable, it reads
   `content-dashboard/data/sample-facebook-scan.json`.
3. `POST /api/sync` is a placeholder for the future Google Sheets sync worker.

Future Google Sheets sync:

```text
Dashboard frontend -> server.mjs API -> Google Sheets source/output tabs
```

Keep Google credentials only on the API/server side. The frontend must keep
calling the same API route even after the backend switches from local JSON to
Google Sheets.

## GitHub / Moving To Another Machine

To use this folder on another machine:

1. Copy the whole folder, or push it to GitHub and clone it.
2. Log in again to Google Drive / Google Sheets on the new machine.
3. Log in again to Chrome/Facebook if browser-assisted scanning is needed.
4. Make sure Codex/Claude plugins or equivalent tools are installed.
5. If AGT skills are needed in another project, run:

```powershell
.\install-agt-skills.ps1 -Destination "C:\path\to\project"
```

or:

```bash
bash ./install-agt-skills.sh /path/to/project
```

The local runtime paths under `C:\Users\Kraik\.cache\...` are machine-specific.
On another machine, use that machine's bundled runtime paths if available.

## Next Build Step

When turning this into an app, keep this boundary:

```text
Frontend -> API routes / worker -> Google Sheets or Meta API
```

Recommended implementation path:

1. Continue from `content-dashboard/`.
2. Replace local JSON reads in `server.mjs` with Google Sheets reads.
3. Add backend sync logic for reading source rows and upserting scan results.
4. Store Google and Meta credentials only in environment variables.
5. Add a scheduled worker for periodic scans.
6. Read source rows from Google Sheets as database records.
7. Upsert scan results to a dedicated output sheet or database table.
8. Keep frontend pointed at the API only.
9. Later migrate storage from Google Sheets to PostgreSQL, Supabase, Firebase, or another managed database without changing frontend routes.
