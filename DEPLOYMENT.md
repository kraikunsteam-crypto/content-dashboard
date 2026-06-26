# GitHub Pages Deployment

This project is deployed with GitHub Pages.

Repository:

```text
https://github.com/kraikunsteam-crypto/content-dashboard
```

Live dashboard:

```text
https://kraikunsteam-crypto.github.io/content-dashboard/
```

Latest verified deploy:

```text
GitHub Actions run 28223941633
Commit fa525aa Enable Pages during deployment
```

## What Gets Deployed

The workflow publishes a static dashboard from:

```text
content-dashboard/
```

Only these files are copied into the Pages artifact:

```text
index.html
styles.css
app.js
data/sample-facebook-scan.json
.nojekyll
```

The local API server is not deployed to GitHub Pages. On GitHub Pages, the
dashboard automatically uses `data/sample-facebook-scan.json`.

## Workflow

GitHub Actions workflow:

```text
.github/workflows/deploy-pages.yml
```

Triggers:

- push to `main`
- manual `workflow_dispatch`

Required repository setting:

```text
Settings -> Pages -> Build and deployment -> Source: GitHub Actions
```

This has already been enabled for the current GitHub repository with:

```powershell
gh api repos/kraikunsteam-crypto/content-dashboard/pages -X POST -f build_type=workflow
```

## Local Preview

Run from `content-dashboard/`:

```powershell
.\run-dashboard.ps1
```

Open:

```text
http://localhost:5177
```

The runner uses Node.js when available. If Node.js is missing, it starts the
PowerShell fallback preview server.

## Current Git State

Remote:

```powershell
origin https://github.com/kraikunsteam-crypto/content-dashboard.git
```

Branch:

```powershell
main tracks origin/main
```

Use this to deploy a new change:

```powershell
git add .
git commit -m "Describe the change"
git push
```

If Git reports dubious ownership on this Windows folder, run Git with the local
safe-directory override:

```powershell
git -c safe.directory="E:/New folder (3)" push
```
