{ delib, inputs, ... }:
delib.host {
  name = "cancer";

  system = "aarch64-linux";
  type = "server";

  nixos = {
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

              fsType = "ext4";
              partitionTableType = "efi";
              bootSize = "512M";

              postVM = ''
                mkdir -p $out/nix-support
                echo "file ${config.amazonImage.format} $diskImage" >> $out/nix-support/hydra-build-products

                ${pkgs.jq}/bin/jq -n \
                  --arg system_version ${lib.escapeShellArg config.system.nixos.version} \
                  --arg system ${lib.escapeShellArg pkgs.stdenv.hostPlatform.system} \
                  --arg logical_bytes "$(${pkgs.qemu_kvm}/bin/qemu-img info --output json "$diskImage" | ${pkgs.jq}/bin/jq '."virtual-size"')" \
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
    system.stateVersion = "25.05";
    virtualisation.diskSize = 8 * 1024;
    zramSwap.enable = true;
  };

  home.home.stateVersion = "25.05";

  myconfig.services = {
    openssh.enable = true;
    opentelemetry-collector.enable = true;
  };
}
