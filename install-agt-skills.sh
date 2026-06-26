#!/usr/bin/env bash
set -euo pipefail

DESTINATION="${1:-.}"
REFRESH="${2:-}"

if [[ "$DESTINATION" == "--refresh" ]]; then
  DESTINATION="."
  REFRESH="--refresh"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TARGET_SKILLS_DIR="$DESTINATION/.claude/skills"
BASE_URL="https://raw.githubusercontent.com/somnus0x/agt-skill-pack/main/skills"

SKILLS=(
  "workflow-scout"
  "factory-review"
  "product-taste"
  "decision-decay"
  "accountability-nag"
  "ai-slop-detection"
  "design-taste"
  "occam"
  "content-scout"
  "ai-memory"
  "agent-boundaries"
  "link-triage"
  "steal-digest"
  "x-collect"
  "axelrod-review"
  "frontend-setup"
  "market-brief-setup"
  "claude-md-setup"
)

mkdir -p "$TARGET_SKILLS_DIR"

for skill in "${SKILLS[@]}"; do
  target_dir="$TARGET_SKILLS_DIR/$skill"
  target_file="$target_dir/SKILL.md"
  mkdir -p "$target_dir"

  if [[ "$REFRESH" == "--refresh" ]]; then
    curl -sL "$BASE_URL/$skill/SKILL.md" -o "$target_file"
  else
    source_file="$SCRIPT_DIR/.claude/skills/$skill/SKILL.md"
    if [[ ! -f "$source_file" ]]; then
      echo "Missing bundled skill: $source_file. Re-run with --refresh." >&2
      exit 1
    fi
    cp "$source_file" "$target_file"
  fi

  echo "installed: $skill"
done

echo ""
echo "Done. Skills installed at $TARGET_SKILLS_DIR"
