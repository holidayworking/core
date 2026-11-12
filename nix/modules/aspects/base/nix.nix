{
  den.aspects.base = {
    os.nix = {
      optimise.automatic = true;

      settings = {
        experimental-features = [
          "flakes"
          "nix-command"
        ];

        extra-substituters = [ "https://cache.numtide.com" ];

        extra-trusted-public-keys = [ "niks3.numtide.com-1:DTx8wZduET09hRmMtKdQDxNNthLQETkc/yaX7M4qK0g=" ];
      };
    };

    darwin = { pkgs, config, ... }: {
      nix = {
        linux-builder = {
          enable = true;
          package = pkgs.darwin.linux-builder-vz;
          config.virtualisation.darwin-builder.diskSize = 40 * 1024;

          systems = [
            "aarch64-linux"
            "x86_64-linux"
          ];
        };

        settings.trusted-users = [ config.system.primaryUser ];
      };
    };
  };
}
