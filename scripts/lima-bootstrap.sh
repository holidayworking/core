#!/usr/bin/env bash

set -euCo pipefail

readonly HOST="${1:-${HOST:-gemini}}"

ssh "$HOST" "mkdir -p ~/.config/sops/age"
scp ~/.config/sops/age/keys.txt "$HOST":~/.config/sops/age/keys.txt

ssh "$HOST" bash -s "$HOST" <<'SSH'
  ssh-keygen -F github.com || ssh-keyscan github.com >> ~/.ssh/known_hosts && \
  mkdir -p ~/src/github.com/holidayworking && \
  cd ~/src/github.com/holidayworking && \
  git clone git@github.com:holidayworking/core.git && \
  cd core && \
  sudo nixos-rebuild switch --flake ".#$1"
SSH
