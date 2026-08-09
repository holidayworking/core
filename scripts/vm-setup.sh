#!/usr/bin/env bash

set -euCo pipefail

readonly TARGET_HOST="${TARGET_HOST:-gemini}"

echo "Copying SOPS age key..."
ssh "$TARGET_HOST" "mkdir -p ~/.config/sops/age && cat > ~/.config/sops/age/keys.txt && chmod 600 ~/.config/sops/age/keys.txt" <~/.config/sops/age/keys.txt

echo "Cloning repository..."
ssh "$TARGET_HOST" "ssh-keygen -F github.com || ssh-keyscan github.com >> ~/.ssh/known_hosts; ghq get git@github.com:holidayworking/core.git"
