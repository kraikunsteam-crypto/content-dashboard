# GitHub Pages Deployment

This project is prepared for GitHub Pages deployment.

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

## Current Blocker For Actual Push

This machine currently has no usable `git` or `gh` command in PATH, and the
local `.git` folder has no `config` or remote. The project is deploy-ready, but
it still must be pushed to a GitHub repository from a machine/session with Git
installed and authenticated.

Suggested commands once Git is available:

```powershell
git init
git add .
git commit -m "Prepare content dashboard for GitHub Pages"
git branch -M main
git remote add origin https://github.com/<owner>/<repo>.git
git push -u origin main
```

After the push, enable GitHub Pages with GitHub Actions as the source.
