#!/usr/bin/env bash

set -euCo pipefail

readonly TARGET_HOST="${TARGET_HOST:-gemini}"

echo "Cloning repository..."
ssh "$TARGET_HOST" "ssh-keygen -F github.com || ssh-keyscan github.com >> ~/.ssh/known_hosts; ghq get git@github.com:holidayworking/core.git"
