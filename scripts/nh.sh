#!/usr/bin/env bash

set -euCo pipefail

readonly ACTION="${1:?Usage: nh.sh <build|switch>}"
shift

HOSTNAME="$(hostname)"
readonly HOSTNAME

nh darwin "$ACTION" --hostname "$HOSTNAME" "$@" .
