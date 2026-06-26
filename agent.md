# Project Brief For Codex

## Goal

Build a project workflow using VS Code, GitHub, and Google Sheets as a lightweight database.

## Core Idea

- Use VS Code as the local development environment.
- Store and version the source code in GitHub.
- Use Google Sheets as a simple, editable database for early-stage data.
- Connect the app to Google Sheets through a middle layer API.
- Do not connect the frontend directly to Google Sheets with exposed credentials.

## Recommended Architecture

```text
Frontend / App
    -> Backend API or Google Apps Script
    -> Google Sheets
```

## Why This Is A Good Fit

- Good for MVPs, prototypes, dashboards, admin tools, catalogs, booking systems, stock lists, and simple order tracking.
- Easy for non-technical users to view and edit data directly in Google Sheets.
- Fast to start without building a full admin panel.
- GitHub keeps the code organized and ready for collaboration or deployment.

## Important Cautions

- Treat Google Sheets as a lightweight database, not a full production database.
- Avoid putting API keys, tokens, service account credentials, or private sheet access directly in frontend code.
- Use environment variables and keep secrets out of GitHub.
- Expect limits around speed, quota, concurrent writes, and complex queries.
- If the app grows, plan to migrate later to a real database such as Supabase, PostgreSQL, Firebase, or another managed database.

## Design Principle

Keep the data access layer separate from the frontend so the storage can be changed later without rebuilding the whole app.

## Google Sheets Database Principle

Treat Google Sheets as the MVP database.

- Each automation/source row should have a stable ID.
- Read source rows from Google Sheets instead of hardcoding channel data.
- Update output data continuously from those rows.
- Use upsert behavior: update existing rows by key, append new rows, and keep history unless deletion is explicitly requested.
- Keep raw source data, scan results, summaries, and dashboard views in separate tabs.
- Frontend must call the API layer only; it must not read or write Sheets directly.

## Future Migration Path

Start with:

```text
App -> API layer -> Google Sheets
```

Later, if needed, migrate to:

```text
App -> API layer -> PostgreSQL / Supabase / Firebase
```

The frontend should keep calling the same API routes as much as possible.

## Instructions For Codex In A New Folder

When continuing this project, assume the user wants:

- A VS Code project.
- GitHub-ready source control.
- Google Sheets used as a lightweight database.
- A backend or Google Apps Script API layer between the app and Google Sheets.
- Secure handling of secrets through environment variables.
- A structure that can migrate to a real database later.

If implementation details are missing, ask for:

1. The app stack, such as React, Next.js, Node.js, Python, or another framework.
2. The data tables needed, such as users, products, orders, bookings, or settings.
3. Whether to create a new Google Sheet or connect to an existing one.

## Current Runbook

Before doing follow-up work in this folder, read:

```text
RUNBOOK.md
```

That file records the current Google Sheet source, Facebook scan workflow,
latest delivered output, data quality rules, and the steps needed to rerun the
process on this or another machine.

## Current App Prototype

The runnable dashboard is in:

```text
content-dashboard/
```

It follows the reference Content OS style and shows:

- KPI overview
- competitor page activity
- hooks and content angles
- next content ideas
- recent post table
- Google Sheets database contract

Run it from VS Code with:

```powershell
cd content-dashboard
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

Keep the frontend connected only to the API routes. Do not connect the browser
directly to Google Sheets.
