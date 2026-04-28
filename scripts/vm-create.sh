#!/usr/bin/env bash

set -euCo pipefail

readonly VM_NAME="${VM_NAME:-NixOS}"
readonly VM_CPU="${VM_CPU:-4}"
readonly VM_MEMORY="${VM_MEMORY:-12772}"
readonly VM_DISK_SIZE="${VM_DISK_SIZE:-262144}"

readonly DOWNLOAD_DIR="$HOME/tmp"
readonly ISO_URL="https://releases.nixos.org/nixos/25.05/nixos-25.05.804002.5f4f306bea96/nixos-minimal-25.05.804002.5f4f306bea96-aarch64-linux.iso"
ISO_PATH="$DOWNLOAD_DIR/$(basename "$ISO_URL")"
readonly ISO_PATH

mkdir -p "$DOWNLOAD_DIR"

if [ ! -f "$ISO_PATH" ]; then
  echo "Starting download..."
  curl --fail --location --retry 3 --output "$ISO_PATH" "$ISO_URL"

  echo "Verifying ISO checksum..."
  EXPECTED_SHA256=$(curl --fail --location --retry 3 -s "${ISO_URL}.sha256" | awk '{print $1}')
  ACTUAL_SHA256=$(shasum -a 256 "$ISO_PATH" | awk '{print $1}')
  if [ "$EXPECTED_SHA256" != "$ACTUAL_SHA256" ]; then
    echo "ERROR: SHA256 checksum mismatch"
    rm -f "$ISO_PATH"
    exit 1
  fi
  echo "Checksum verified."
else
  echo "ISO file already exists: $ISO_PATH"
fi

echo "Creating VM..."
prlctl create "$VM_NAME" --ostype linux --distribution linux --no-hdd

echo "Applying VM configuration changes..."
prlctl set "$VM_NAME" \
  --autostart user-login \
  --autostart-delay 5 \
  --on-window-close keep-running
prlctl set "$VM_NAME" \
  --cpus "$VM_CPU" \
  --memsize "$VM_MEMORY" \
  --rosetta-linux on
prlctl set "$VM_NAME" \
  --device-add hdd \
  --size "$VM_DISK_SIZE" \
  --type expand
prlctl set "$VM_NAME" \
  --device-set cdrom0 \
  --image "$ISO_PATH" \
  --connect

echo "Starting VM..."
prlctl start "$VM_NAME"
