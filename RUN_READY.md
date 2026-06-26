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

- `POST /api/sync` is a placeholder.
- Google Sheets writeback is not implemented in the local API yet.
- Exact Facebook metrics require an approved Meta/API/export source.
