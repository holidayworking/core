{
  delib,
  host,
  pkgs,
  lib,
  ...
}:
delib.module {
  name = "programs.grafana-alloy";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled =
    { myconfig, ... }:
    let
      inherit (myconfig.constants) username;

      alloyConfigFile = pkgs.writeText "config.alloy" ''
        prometheus.exporter.self "alloy_check" { }

        discovery.relabel "alloy_check" {
          targets = prometheus.exporter.self.alloy_check.targets

          rule {
            target_label = "instance"
            replacement  = constants.hostname
          }

          rule {
            target_label = "alloy_hostname"
            replacement  = constants.hostname
          }

          rule {
            target_label = "job"
            replacement  = "integrations/alloy-check"
          }
        }

        prometheus.scrape "alloy_check" {
          targets    = discovery.relabel.alloy_check.output
          forward_to = [prometheus.relabel.alloy_check.receiver]

          scrape_interval = "60s"
        }

        prometheus.relabel "alloy_check" {
          forward_to = [prometheus.remote_write.metrics_service.receiver]

          rule {
            source_labels = ["__name__"]
            regex         = "(prometheus_target_sync_length_seconds_sum|prometheus_target_scrapes_.*|prometheus_target_interval.*|prometheus_sd_discovered_targets|alloy_build.*|prometheus_remote_write_wal_samples_appended_total|process_start_time_seconds)"
            action        = "keep"
          }
        }

        prometheus.remote_write "metrics_service" {
          endpoint {
            url = "https://prometheus-prod-49-prod-ap-northeast-0.grafana.net/api/prom/push"

            basic_auth {
              username = "3318616"
              password = sys.env("GCLOUD_RW_API_KEY")
            }
          }
        }

        loki.write "grafana_cloud_loki" {
          endpoint {
            url = "https://logs-prod-030.grafana.net/loki/api/v1/push"

            basic_auth {
              username = "1654983"
              password = sys.env("GCLOUD_RW_API_KEY")
            }
          }
        }

        prometheus.exporter.unix "integrations_node_exporter" { }

        discovery.relabel "integrations_node_exporter" {
          targets = prometheus.exporter.unix.integrations_node_exporter.targets

          rule {
            target_label = "instance"
            replacement  = constants.hostname
          }

          rule {
            target_label = "job"
            replacement  = "integrations/macos-node"
          }
        }

        prometheus.scrape "integrations_node_exporter" {
          targets    = discovery.relabel.integrations_node_exporter.output
          forward_to = [prometheus.relabel.integrations_node_exporter.receiver]
          job_name   = "integrations/node_exporter"
        }

        prometheus.relabel "integrations_node_exporter" {
          forward_to = [prometheus.remote_write.metrics_service.receiver]

          rule {
            source_labels = ["__name__"]
            regex         = "up|node_boot_time_seconds|node_cpu_seconds_total|node_disk_io_time_seconds_total|node_disk_read_bytes_total|node_disk_written_bytes_total|node_filesystem_avail_bytes|node_filesystem_files|node_filesystem_files_free|node_filesystem_readonly|node_filesystem_size_bytes|node_load1|node_load15|node_load5|node_memory_compressed_bytes|node_memory_internal_bytes|node_memory_purgeable_bytes|node_memory_swap_total_bytes|node_memory_swap_used_bytes|node_memory_total_bytes|node_memory_wired_bytes|node_network_receive_bytes_total|node_network_receive_drop_total|node_network_receive_errs_total|node_network_receive_packets_total|node_network_transmit_bytes_total|node_network_transmit_drop_total|node_network_transmit_errs_total|node_network_transmit_packets_total|node_os_info|node_textfile_scrape_error|node_uname_info"
            action        = "keep"
          }
        }

        local.file_match "logs_integrations_integrations_node_exporter_direct_scrape" {
          path_targets = [{
            __address__ = "localhost",
            __path__    = "/var/log/*.log",
            instance    = constants.hostname,
            job         = "integrations/macos-node",
          }]
        }

        loki.process "logs_integrations_integrations_node_exporter_direct_scrape" {
          forward_to = [loki.write.grafana_cloud_loki.receiver]

          stage.multiline {
            firstline     = "^([\\w]{3} )?[\\w]{3} +[\\d]+ [\\d]+:[\\d]+:[\\d]+|[\\w]{4}-[\\w]{2}-[\\w]{2} [\\w]{2}:[\\w]{2}:[\\w]{2}(?:[+-][\\w]{2})?"
            max_lines     = 0
            max_wait_time = "10s"
          }

          stage.regex {
            expression = "(?P<timestamp>([\\w]{3} )?[\\w]{3} +[\\d]+ [\\d]+:[\\d]+:[\\d]+|[\\w]{4}-[\\w]{2}-[\\w]{2} [\\w]{2}:[\\w]{2}:[\\w]{2}(?:[+-][\\w]{2})?) (?P<hostname>\\S+) (?P<sender>.+?)\\[(?P<pid>\\d+)\\]:? (?P<message>(?s:.*))$"
          }

          stage.labels {
            values = {
              hostname = null,
              pid      = null,
              sender   = null,
            }
          }

          stage.match {
            selector = "{sender!=\"\", pid!=\"\"}"

            stage.template {
              source   = "message"
              template = "{{ .sender }}[{{ .pid }}]: {{ .message }}"
            }

            stage.label_drop {
              values = ["pid"]
            }

            stage.output {
              source = "message"
            }
          }
        }

        loki.source.file "logs_integrations_integrations_node_exporter_direct_scrape" {
          targets    = local.file_match.logs_integrations_integrations_node_exporter_direct_scrape.targets
          forward_to = [loki.process.logs_integrations_integrations_node_exporter_direct_scrape.receiver]
        }
      '';
    in
    {
      homebrew = {
        brews = [
          {
            name = "grafana/grafana/alloy";
            start_service = true;
            restart_service = "changed";
          }
        ];

        taps = [ "grafana/grafana" ];
      };

      sops = {
        secrets."grafana-cloud-alloy-rw-api-key".owner = username;

        # config.alloy has no secrets and is installed by the activation
        # script below; config.env holds the API key and is rendered by
        # sops-nix from this template. The placeholder is sops-nix's own
        # fixed hash formula (see `sops.placeholder` in
        # sops-nix/modules/nix-darwin/templates/default.nix), computed here
        # because `darwin.ifEnabled` cannot reach the real nix-darwin
        # `config`: denix wraps its result in `lib.mkIf`, so a nested
        # `imports` used to reach `config` would be misread as the option
        # `config.imports`.
        templates."alloy-config-env" = {
          path = "/opt/homebrew/etc/alloy/config.env";
          mode = "0600";
          owner = username;
          content = ''
            export GCLOUD_RW_API_KEY="<SOPS:${builtins.hashString "sha256" "grafana-cloud-alloy-rw-api-key"}:PLACEHOLDER>"
          '';
        };
      };

      # sops-nix installs secrets/templates via `lib.mkAfter` (order 1500)
      # in postActivation, so config.alloy must be written before that
      # (mkBefore) and the service restart must happen after it (order
      # 1600) to pick up both config.alloy and the freshly-rendered
      # config.env. The restart is gated on the combined content hash of
      # the two files so an unchanged rebuild does not interrupt the
      # running service; binary upgrades are restarted by the brew's
      # `restart_service = "changed"` instead.
      system.activationScripts.postActivation.text = lib.mkMerge [
        (lib.mkBefore ''
          install -d -o ${username} -g admin -m 0755 /opt/homebrew/etc/alloy
          install -m 0644 -o ${username} -g admin ${alloyConfigFile} /opt/homebrew/etc/alloy/config.alloy
        '')
        (lib.mkOrder 1600 ''
          alloy_dir=/opt/homebrew/etc/alloy
          alloy_hash="$(/bin/cat "$alloy_dir/config.alloy" "$alloy_dir/config.env" 2>/dev/null | /usr/bin/shasum -a 256 | /usr/bin/cut -d' ' -f1)"
          if [ "$alloy_hash" != "$(/bin/cat "$alloy_dir/.config-hash" 2>/dev/null)" ]; then
            uid="$(id -u ${username})"
            if launchctl print "gui/$uid/homebrew.mxcl.alloy" >/dev/null 2>&1; then
              launchctl kickstart -k "gui/$uid/homebrew.mxcl.alloy" \
                || echo "warning: failed to restart homebrew.mxcl.alloy" >&2
            fi
            echo "$alloy_hash" > "$alloy_dir/.config-hash"
          fi
        '')
      ];
    };
}
