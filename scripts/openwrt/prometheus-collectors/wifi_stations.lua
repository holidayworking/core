-- The Linksys Velop WRT Pro 7 cannot use prometheus-node-exporter-lua-wifi_stations
-- either (see wifi.lua): even after switching interface discovery to UCI,
-- iwinfo's assoclist() always returns nil for this firmware's wifi-device
-- type ("qcawificfg80211", QCA/QSDK), so no per-station data is available
-- through iwinfo on this device.
--
-- This collector instead shells out to hostapd_cli, which talks to the
-- per-radio hostapd control socket at /var/run/hostapd-<device>/<ifname>
-- and returns real station stats (signal, inactive time, tx/rx counters)
-- regardless of the iwinfo/ubus limitation.
--
-- Do not `opkg install prometheus-node-exporter-lua-wifi_stations` -- it
-- will overwrite this file with the non-functional upstream version.

local uci = require("uci")

local cursor = uci.cursor()

local function gauge(name)
	return metric(name, "gauge")
end

local function counter(name)
	return metric(name, "counter")
end

local metric_wifi_stations = gauge("wifi_stations")
local station_metrics = {
	{ field = "signal", metric = gauge("wifi_station_signal_dbm") },
	{ field = "inactive_msec", metric = gauge("wifi_station_inactive_milliseconds") },
	{ field = "tx_packets", metric = counter("wifi_station_transmit_packets_total") },
	{ field = "rx_packets", metric = counter("wifi_station_receive_packets_total") },
	{ field = "tx_bytes", metric = counter("wifi_station_transmit_bytes_total") },
	{ field = "rx_bytes", metric = counter("wifi_station_receive_bytes_total") },
}

-- hostapd_cli's `all_sta` output is a flat station MAC address line
-- followed by its "key=value" attribute lines, repeated per station. If
-- hostapd_cli can't reach the control socket, it prints an error line
-- instead (e.g. "Failed to connect to hostapd - ..."); the MAC check below
-- keeps that from being mistaken for a station.
local function parse_stations(output)
	local stations = {}
	local current
	for line in output:gmatch("[^\n]+") do
		local key, value = line:match("^(%w[%w_]*)=(.*)$")
		if key and current then
			current[key] = value
		elseif line:match("^%x%x:%x%x:%x%x:%x%x:%x%x:%x%x$") then
			current = {}
			stations[line] = current
		else
			current = nil
		end
	end
	return stations
end

local function scrape()
	-- Interfaces are independent hostapd control sockets, so every
	-- `hostapd_cli` process is started before any of them are read back --
	-- the wait time is bounded by the slowest socket instead of their sum.
	local procs = {}
	cursor:foreach("wireless", "wifi-iface", function(section)
		local ifname = section.ifname
		local device = section.device
		if not ifname or not device then
			return
		end

		local proc =
			io.popen(string.format("hostapd_cli -p '/var/run/hostapd-%s' -i '%s' all_sta 2>/dev/null", device, ifname))
		if proc then
			procs[#procs + 1] = { ifname = ifname, proc = proc }
		end
	end)

	for _, p in ipairs(procs) do
		local output = p.proc:read("*a")
		p.proc:close()

		local count = 0
		for mac, sta in pairs(parse_stations(output)) do
			count = count + 1
			local labels = { ifname = p.ifname, mac = mac }

			for _, sm in ipairs(station_metrics) do
				local value = sta[sm.field]
				if value then
					sm.metric(labels, tonumber(value))
				end
			end
		end

		metric_wifi_stations({ ifname = p.ifname }, count)
	end
end

return { scrape = scrape }
