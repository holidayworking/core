-- The Linksys Velop WRT Pro 7 cannot use prometheus-node-exporter-lua-wifi:
-- its collector calls `ubus call network.wireless status`, which always
-- returns {} because this firmware's wifi-device type
-- ("qcawificfg80211", QCA/QSDK) is never registered with netifd's wireless
-- subsystem. This collector reads wifi-iface sections from UCI
-- (/etc/config/wireless) instead and queries iwinfo per ifname directly.
--
-- Do not `opkg install prometheus-node-exporter-lua-wifi` -- it will
-- overwrite this file with the non-functional upstream version.

local uci = require("uci")
local iwinfo = require("iwinfo")

-- Reused across scrapes: libuci reloads a package from disk only when its
-- mtime changes, so a shared cursor avoids re-parsing /etc/config/wireless
-- on every request.
local cursor = uci.cursor()

local function gauge(name)
	return metric(name, "gauge")
end

local metric_wifi_network_quality = gauge("wifi_network_quality")
local metric_wifi_network_bitrate = gauge("wifi_network_bitrate")
local metric_wifi_network_noise = gauge("wifi_network_noise_dbm")
local metric_wifi_network_signal = gauge("wifi_network_signal_dbm")

local function scrape()
	cursor:foreach("wireless", "wifi-iface", function(section)
		local ifname = section.ifname
		if not ifname then
			return
		end

		local t = iwinfo.type(ifname)
		local iw = t and iwinfo[t]
		if not iw then
			return
		end

		local labels = {
			channel = iw.channel(ifname),
			ssid = iw.ssid(ifname),
			bssid = iw.bssid(ifname),
			mode = iw.mode(ifname),
			ifname = ifname,
			country = iw.country(ifname),
			frequency = iw.frequency(ifname),
			device = section.device,
		}

		local qc = iw.quality(ifname) or 0
		local qm = iw.quality_max(ifname) or 0
		local quality = qm > 0 and math.floor((100 / qm) * qc) or 0

		metric_wifi_network_quality(labels, quality)
		metric_wifi_network_noise(labels, iw.noise(ifname) or 0)
		metric_wifi_network_bitrate(labels, iw.bitrate(ifname) or 0)
		metric_wifi_network_signal(labels, iw.signal(ifname) or -255)
	end)
end

return { scrape = scrape }
