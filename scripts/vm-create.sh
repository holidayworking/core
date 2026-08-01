#!/usr/bin/env bash

set -euCo pipefail

readonly VM_NAME="${VM_NAME:-NixOS}"
readonly VM_CPU="${VM_CPU:-4}"
readonly VM_MEMORY="${VM_MEMORY:-12772}"
readonly VM_DISK_SIZE="${VM_DISK_SIZE:-262144}"

readonly DOWNLOAD_DIR="$HOME/tmp"
readonly ISO_URL="https://releases.nixos.org/nixos/26.05/nixos-26.05.5449.293d6abedf04/nixos-minimal-26.05.5449.293d6abedf04-aarch64-linux.iso"
ISO_PATH="$DOWNLOAD_DIR/$(basename "$ISO_URL")"
readonly ISO_PATH

mkdir -p "$DOWNLOAD_DIR"

verify_checksum() {
  local file="$1"
  local expected actual
  expected=$(curl --fail --location --retry 3 -s "${ISO_URL}.sha256" | awk '{print $1}')
  actual=$(shasum -a 256 "$file" | awk '{print $1}')
  [ "$expected" = "$actual" ]
}

if [ -f "$ISO_PATH" ] && verify_checksum "$ISO_PATH"; then
  echo "ISO file already exists and checksum verified: $ISO_PATH"
else
  echo "Starting download..."
  TMP_ISO_PATH="$ISO_PATH.part"
  rm -f "$TMP_ISO_PATH"
  curl --fail --location --retry 3 --output "$TMP_ISO_PATH" "$ISO_URL"

  echo "Verifying ISO checksum..."
  if ! verify_checksum "$TMP_ISO_PATH"; then
    echo "ERROR: SHA256 checksum mismatch"
    rm -f "$TMP_ISO_PATH"
    exit 1
  fi
  mv "$TMP_ISO_PATH" "$ISO_PATH"
  echo "Checksum verified."
fi

echo "Creating VM..."
prlctl create "$VM_NAME" --ostype linux --distribution linux --no-hdd

echo "Applying VM configuration changes..."
prlctl set "$VM_NAME" \
  --autostart user-login \
  --autostart-delay 5 \
  --on-window-close keep-running \
  --cpus "$VM_CPU" \
  --memsize "$VM_MEMORY" \
  --rosetta-linux on \
  --high-resolution on
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
