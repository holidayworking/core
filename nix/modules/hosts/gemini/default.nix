{ den, inputs, ... }:
{
  flake-file.inputs = {
    apple-silicon = {
      url = "github:nix-community/nixos-apple-silicon";

      inputs = {
        flake-compat.follows = "";
        nixpkgs.follows = "nixpkgs";
      };
    };

    asahi-firmware = {
      url = "path:./nix/modules/hosts/gemini/firmware";
      flake = false;
    };
  };

  den.hosts.aarch64-linux.gemini.users.hidekazu = { };

  den.aspects.gemini = {
    includes = with den.aspects; [
      ai
      desktop
    ];

    nixos = { modulesPath, ... }: {
      imports = [
        (modulesPath + "/installer/scan/not-detected.nix")
        inputs.apple-silicon.nixosModules.apple-silicon-support
      ];

      boot.loader.systemd-boot.enable = true;

      fileSystems = {
        "/" = {
          device = "/dev/disk/by-label/nixos";
          fsType = "ext4";
        };

        "/boot" = {
          device = "/dev/disk/by-label/EFI\\x20-\\x20NIXOS";
          fsType = "vfat";

          options = [
            "dmask=0022"
            "fmask=0022"
          ];
        };
      };

      hardware.asahi = {
        enable = true;
        peripheralFirmwareDirectory = inputs.asahi-firmware;
      };

      networking.networkmanager = {
        enable = true;
        wifi.backend = "iwd";
      };
    };
  };
}
