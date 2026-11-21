{ inputs, ... }:
let
  region = "ap-northeast-1";
in
{
  den.hosts.aarch64-linux.cancer.users.hidekazu = { };

  den.aspects.cancer = {
    nixos = { pkgs, ... }: {
      imports = [
        "${inputs.nixpkgs}/nixos/maintainers/scripts/ec2/amazon-image.nix"
      ];

      amazonImage.format = "raw";

      ec2.efi = true;

      # Let `make nix/switch TARGET_HOST=cancer` copy unsigned, locally built paths. This grants
      # nothing new: wheel already gets root through passwordless sudo.
      nix.settings.trusted-users = [ "@wheel" ];

      security.sudo-rs.wheelNeedsPassword = false;

      services = {
        openssh.enable = true;

        opentelemetry-collector = {
          enable = true;

          # github.com/cockroachdb/swiss, a dependency of otelcol-contrib, fails to compile with Go 1.27.
          package =
            (pkgs.opentelemetry-collector-releases.override { buildGoModule = pkgs.buildGo126Module; })
            .otelcol-contrib;

          settings = {
            exporters.otlphttp = {
              auth.authenticator = "sigv4auth";
              metrics_endpoint = "https://monitoring.${region}.amazonaws.com/v1/metrics";
            };

            extensions.sigv4auth = {
              inherit region;
              service = "monitoring";
            };

            processors = {
              batch = {
                send_batch_size = 200;
                timeout = "10s";
              };

              cumulativetodelta = { };

              transform = {
                error_mode = "ignore";

                metric_statements = [
                  {
                    context = "metric";

                    statements = [
                      ''convert_sum_to_gauge() where metric.name == "node_time_seconds"''
                    ];
                  }
                ];
              };
            };

            receivers.prometheus.config.scrape_configs = [
              {
                job_name = "openwrt";
                scrape_interval = "60s";

                static_configs = [
                  { targets = [ "openwrt:9100" ]; }
                ];
              }
            ];

            service = {
              extensions = [ "sigv4auth" ];

              pipelines.metrics = {
                exporters = [ "otlphttp" ];

                # Order matters: processors run in this order.
                processors = [
                  "transform"
                  "cumulativetodelta"
                  "batch"
                ];

                receivers = [ "prometheus" ];
              };
            };
          };

          # sigv4auth looks up AWS credentials while validating, which fails in the
          # build sandbox.
          validateConfigFile = false;
        };
      };

      virtualisation.diskSize = 8 * 1024;

      zramSwap.enable = true;
    };
  };
}
