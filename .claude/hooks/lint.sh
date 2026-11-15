#!/usr/bin/env bash
# PostToolUse hook: run the linters of `vp run lint` (cspell, markdownlint,
# textlint) on the file Claude just edited, so CI-only failures surface
# immediately, then `vp check --fix` and `nix fmt` on it. Exit code 2 feeds
# the output back to Claude.
set -uo pipefail

cd "${CLAUDE_PROJECT_DIR:?}" || exit 0

file=$(jq -r '.tool_input.file_path // empty')
[[ -f $file && $file == "$CLAUDE_PROJECT_DIR"/* ]] || exit 0
file=${file#"$CLAUDE_PROJECT_DIR"/}

bin=node_modules/.bin
[[ -d $bin ]] || exit 0

output=
status=0
run() { output+=$("$@" 2>&1)$'\n' || status=1; }

run "$bin/cspell" --no-progress --no-summary --no-must-find-files "$file"

if [[ $file == *.md ]]; then
  run "$bin/markdownlint-cli2" --no-globs ":$file"
  run "$bin/textlint" "$file"
fi

run "$bin/vp" check --fix --no-error-on-unmatched-pattern "$file"
run nix fmt -- "$file"

if ((status)); then
  printf 'vp run lint / vp check / nix fmt failed for %s:\n%s' "$file" "$output" >&2
  exit 2
fi
