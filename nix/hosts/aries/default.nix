{ delib, ... }:
delib.host {
  name = "aries";

  system = "aarch64-darwin";
  type = "desktop";

  darwin = {
    system.stateVersion = 5;

    nix = {
      linux-builder.enable = true;
      settings.trusted-users = [ "hidekazu" ];
    };
  };

  home.home.stateVersion = "25.05";

  myconfig.programs.cn-daemon.enable = true;
}
