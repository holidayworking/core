{ den, ... }:
{
  den.hosts.aarch64-darwin.aries.users.hidekazu = { };

  den.aspects.aries = {
    includes = with den.aspects; [
      ai
      desktop
    ];

    darwin.nix.linux-builder = {
      config.virtualisation = {
        cores = 4;
        darwin-builder.memorySize = 16 * 1024;
        vz.nestedVirtualization = true;
      };

      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
        "nixos-test"
      ];
    };

    homeManager = { pkgs, ... }: {
      home.packages = [ pkgs.lmstudio ];

      programs.obsidian.enable = true;
    };
  };
}
