# Project Summary

## What This Folder Contains

This folder is a portable starter project for:

```text
VS Code + GitHub + Google Sheets database + API-first dashboard
```

Core rule:

```text
Frontend -> API / Worker -> Google Sheets
```

The frontend must never read or write Google Sheets directly.

## Current Working App

Runnable dashboard:

```text
content-dashboard/
```

Run:

```powershell
cd content-dashboard
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

## Dashboard Features

Current status: this is the advanced content analysis dashboard prototype for
this folder. It is not only a raw post table; it already turns competitor post
data into decision-ready content signals.

- KPI overview for recent Facebook competitor posts
- Top 5 trending content ranked by reactions + comments + shares
- competitor activity cards
- hook/content angle extraction with source post buttons
- suggested next content ideas
- recent post table with metric confidence and source post buttons
- database contract section showing the API boundary

Production caveat: exact official metrics still require a live Google Sheets
sync and, ideally, Meta Graph API or an approved Meta export. Until then, the
dashboard uses the latest local scan JSON and marks public-scrape metric
confidence.

## Data Source

Current local seed:

```text
outputs/facebook-content-scan/cleaned_posts.json
```

Portable fallback seed:

```text
content-dashboard/data/sample-facebook-scan.json
```

Original Google Sheets source:

```text
11A_Channel_Link_Library
```

## Database Rule

Treat Google Sheets as the MVP database:

1. Source rows live in Google Sheets.
2. API/worker reads those rows.
3. API/worker scans or fetches external content.
4. API/worker upserts results into output tabs.
5. Dashboard reads clean JSON from API routes only.

Use stable keys such as:

- `Link ID`
- `Channel ID`
- `Post URL`
- fallback: `Channel ID + Post Date + Caption`

## Next Step

Replace the local JSON read in:

```text
content-dashboard/server.mjs
```

with real Google Sheets read/write logic, while keeping this frontend API route:

```text
GET /api/dashboard
```
