# AGT Skill Pack

This folder includes the full AGT Skill Pack installed under:

```text
.claude/skills/
```

It is intended for Claude / Claude Code workflows. The skills are bundled in
this project so another machine can get the same setup by cloning the repo or
extracting the archive.

## Installed Skills

- workflow-scout
- factory-review
- product-taste
- decision-decay
- accountability-nag
- ai-slop-detection
- design-taste
- occam
- content-scout
- ai-memory
- agent-boundaries
- link-triage
- steal-digest
- x-collect
- axelrod-review
- frontend-setup
- market-brief-setup
- claude-md-setup

## Use On Another Machine

Option 1: clone or download this project.

```bash
git clone <your-repo-url>
cd <repo-folder>
```

The `.claude/skills` folder is already included.

Option 2: copy only the skills into another project.

Windows PowerShell:

```powershell
.\install-agt-skills.ps1 -Destination "C:\path\to\other\project"
```

Bash:

```bash
bash ./install-agt-skills.sh /path/to/other/project
```

Option 3: extract `agt-skill-pack-all.zip` into another project root.

## Refresh From Upstream

To download the latest upstream AGT skills again, run:

```powershell
.\install-agt-skills.ps1 -RefreshFromGitHub
```

or:

```bash
bash ./install-agt-skills.sh --refresh
```

Upstream source:

```text
https://github.com/somnus0x/agt-skill-pack
```
