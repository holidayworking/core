#!/usr/bin/env bash

set -euCo pipefail

readonly ACTION="${1:?Usage: nh.sh <build|switch>}"
shift

subcommand=os

if [[ -n ${TARGET_HOST:-} ]]; then
  extra_args=(--elevation-strategy passwordless --target-host "$TARGET_HOST" --build-host "$TARGET_HOST")
else
  if [[ "$(uname)" == "Darwin" ]]; then
    subcommand=darwin
  fi
  extra_args=(--hostname "$HOSTNAME")
fi

if [[ -f /boot/vendorfw/firmware.cpio ]]; then
  extra_args+=(--override-input asahi-firmware path:/boot/vendorfw)
fi

nh "$subcommand" "$ACTION" "${extra_args[@]}" "$@" .
