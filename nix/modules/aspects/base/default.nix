{
  den.aspects.base = {
    os = { pkgs, ... }: {
      environment.systemPackages = with pkgs; [
        corepack_24
        gnumake
        nodejs_24
      ];

      programs.nh = {
        enable = true;

        clean = {
          enable = true;
          extraArgs = "--keep 5 --keep-since 7d --no-direnv";
        };
      };

      services.tailscale.enable = true;
    };

    nixos = { lib, pkgs, ... }: {
      boot.kernelPackages = lib.mkDefault pkgs.linuxPackages_latest;

      programs.nix-ld.enable = true;

      security.sudo-rs.enable = true;

      time.timeZone = "Asia/Tokyo";
    };

    darwin = { config, ... }: {
      networking = {
        computerName = config.networking.hostName;

        knownNetworkServices = [
          "Ethernet"
          "Wi-Fi"
        ];
      };

      services.tailscale.overrideLocalDns = true;

      system.defaults.SoftwareUpdate.AutomaticallyInstallMacOSUpdates = true;
    };

    homeManager = { lib, pkgs, ... }: {
      programs = {
        direnv.enable = true;
        jq.enable = true;

        vim = {
          enable = true;
          packageConfigurable = pkgs.vim;
          defaultEditor = true;
        };
      };

      targets.darwin = lib.mkIf pkgs.stdenv.hostPlatform.isDarwin {
        copyApps.enable = true;
        linkApps.enable = false;
      };
    };
  };
}
