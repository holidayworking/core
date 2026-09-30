{ delib, ... }:
delib.host {
  name = "aries";

  system = "aarch64-darwin";
  type = "desktop";

  darwin = {
    system.stateVersion = 5;

    nix.linux-builder = {
      config.virtualisation.vz.nestedVirtualization = true;
      supportedFeatures = [
        "benchmark"
        "big-parallel"
        "kvm"
        "nixos-test"
      ];
    };
  };

  home.home.stateVersion = "25.05";
}
