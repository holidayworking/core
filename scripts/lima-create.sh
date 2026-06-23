#!/usr/bin/env bash

set -euCo pipefail

readonly NAME="${1:-default}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
readonly SCRIPT_DIR

readonly CONFIG="${SCRIPT_DIR}/../nix/lima.yaml"

limactl start --name="$NAME" --tty=false "$CONFIG"
