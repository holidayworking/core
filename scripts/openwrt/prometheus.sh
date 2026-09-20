#!/usr/bin/env bash

set -euCo pipefail

HOST="${1:-openwrt}"

ssh "$HOST" '
  set -e
  missing=""
  for pkg in prometheus-node-exporter-lua prometheus-node-exporter-lua-openwrt prometheus-node-exporter-lua-netstat; do
    [ -n "$(opkg status "$pkg")" ] || missing="$missing $pkg"
  done
  if [ -n "$missing" ]; then
    opkg update
    opkg install $missing
  fi
'

scp -O "$(dirname "${BASH_SOURCE[0]}")/prometheus-collectors"/*.lua "${HOST}:/usr/lib/lua/prometheus-collectors/"

ssh "$HOST" '
  set -e
  uci set prometheus-node-exporter-lua.main.listen_interface="*"
  uci commit prometheus-node-exporter-lua
  /etc/init.d/prometheus-node-exporter-lua restart
'
