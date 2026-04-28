#!/usr/bin/env bash

set -euCo pipefail

readonly VM_NAME="${VM_NAME:-NixOS}"
readonly VM_IP="${VM_IP}"

echo "Bootstrapping NixOS on VM..."
nix run github:nix-community/nixos-anywhere -- \
  --flake .#gemini \
  --target-host root@"$VM_IP" \
  --phases kexec,disko,install

echo "Restarting VM..."
prlctl stop "$VM_NAME" --kill
prlctl set "$VM_NAME" --device-set cdrom0 --disconnect
prlctl start "$VM_NAME"
