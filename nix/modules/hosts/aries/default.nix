{ den, ... }:
{
  den.hosts.aarch64-darwin.aries.users.hidekazu = { };

  den.aspects.aries = {
    includes = with den.aspects; [
      ai
      desktop
    ];

    darwin.nix.linux-builder = {
      config.virtualisation.vz.nestedVirtualization = true;

      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
        "nixos-test"
      ];
    };
  };
}
