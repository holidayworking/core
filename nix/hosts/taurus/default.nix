{ delib, ... }:
delib.host {
  name = "taurus";

  system = "aarch64-darwin";
  type = "laptop";

  darwin = {
    system.stateVersion = 5;

    nix = {
      linux-builder.enable = true;
      settings.trusted-users = [ "hidekazu" ];
    };
  };

  home.home.stateVersion = "25.05";
}
