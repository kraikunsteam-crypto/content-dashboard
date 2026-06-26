param(
  [string]$Destination = ".",
  [switch]$RefreshFromGitHub
)

$ErrorActionPreference = "Stop"

$Skills = @(
  "workflow-scout",
  "factory-review",
  "product-taste",
  "decision-decay",
  "accountability-nag",
  "ai-slop-detection",
  "design-taste",
  "occam",
  "content-scout",
  "ai-memory",
  "agent-boundaries",
  "link-triage",
  "steal-digest",
  "x-collect",
  "axelrod-review",
  "frontend-setup",
  "market-brief-setup",
  "claude-md-setup"
)

$ProjectRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$DestinationRoot = Resolve-Path -LiteralPath $Destination
$TargetSkillsDir = Join-Path $DestinationRoot ".claude\skills"
$BaseUrl = "https://raw.githubusercontent.com/somnus0x/agt-skill-pack/main/skills"

New-Item -ItemType Directory -Force -Path $TargetSkillsDir | Out-Null

foreach ($Skill in $Skills) {
  $TargetDir = Join-Path $TargetSkillsDir $Skill
  $TargetFile = Join-Path $TargetDir "SKILL.md"
  New-Item -ItemType Directory -Force -Path $TargetDir | Out-Null

  if ($RefreshFromGitHub) {
    $Url = "$BaseUrl/$Skill/SKILL.md"
    Invoke-WebRequest -Uri $Url -OutFile $TargetFile
  } else {
    $SourceFile = Join-Path $ProjectRoot ".claude\skills\$Skill\SKILL.md"
    if (-not (Test-Path -LiteralPath $SourceFile)) {
      throw "Missing bundled skill: $SourceFile. Re-run with -RefreshFromGitHub."
    }
    Copy-Item -LiteralPath $SourceFile -Destination $TargetFile -Force
  }

  Write-Output "installed: $Skill"
}

Write-Output ""
Write-Output "Done. Skills installed at $TargetSkillsDir"
