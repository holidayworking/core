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
        # amazon-image.nix doesn't expose bootSize for ext4 images (defaults to 256M),
        # so rebuild the image with make-disk-image.nix to enlarge the ESP.
        (
          {
            lib,
            pkgs,
            config,
            ...
          }:
          {
            # The override below hardcodes the EFI/ext4 branch of upstream's builder.
            assertions = [
              {
                assertion = config.ec2.efi && !config.ec2.zfs.enable;
                message = "cancer's amazonImage override only supports ec2.efi without ec2.zfs";
              }
            ];

            system.build.amazonImage = lib.mkForce (
              import "${inputs.nixpkgs}/nixos/lib/make-disk-image.nix" {
                inherit lib config pkgs;
                inherit (config.amazonImage) contents format;
                inherit (config.image) baseName;
                inherit (config.virtualisation) diskSize;
                name = config.image.baseName;

                configFile = pkgs.writeText "configuration.nix" ''
                  { modulesPath, ... }: {
                    imports = [ "''${modulesPath}/virtualisation/amazon-image.nix" ];
                    ec2.efi = true;
                  }
                '';

                bootSize = "512M";
                fsType = "ext4";
                partitionTableType = "efi";

                postVM = ''
                  mkdir -p $out/nix-support
                  echo "file ${config.amazonImage.format} $diskImage" >> $out/nix-support/hydra-build-products

                  ${lib.getExe pkgs.jq} -n \
                    --arg system_version ${lib.escapeShellArg config.system.nixos.version} \
                    --arg system ${lib.escapeShellArg pkgs.stdenv.hostPlatform.system} \
                    --arg logical_bytes "$(${lib.getExe' pkgs.qemu-utils "qemu-img"} info --output json "$diskImage" | ${lib.getExe pkgs.jq} '."virtual-size"')" \
                    --arg boot_mode "uefi" \
                    --arg file "$diskImage" \
                    '{}
                    | .label = $system_version
                    | .boot_mode = $boot_mode
                    | .system = $system
                    | .logical_bytes = $logical_bytes
                    | .file = $file
                    | .disks.root.logical_bytes = $logical_bytes
                    | .disks.root.file = $file
                    ' > $out/nix-support/image-info.json
                '';
              }
            );
          }
        )
      ];

      amazonImage.format = "raw";

      ec2.efi = true;

      security.sudo-rs.wheelNeedsPassword = false;

      services = {
        openssh.enable = true;

        opentelemetry-collector = {
          enable = true;
          package = pkgs.opentelemetry-collector-contrib;

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
