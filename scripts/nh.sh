#!/usr/bin/env bash

set -euCo pipefail

readonly ACTION="${1:?Usage: nh.sh <build|switch>}"
shift

HOSTNAME="$(hostname)"
readonly HOSTNAME

if [[ "$(uname)" == "Darwin" ]]; then
  nh darwin "$ACTION" --hostname "$HOSTNAME" "$@" .
else
  nh os "$ACTION" --hostname "$HOSTNAME" "$@" .
fi
