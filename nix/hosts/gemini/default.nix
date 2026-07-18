{
  delib,
  config,
  lib,
  ...
}:
delib.host {
  name = "gemini";

  system = "aarch64-linux";
  type = "server";

  nixos = {
    users.users.hidekazu.home = "/home/${config.myconfig.constants.username}.guest";
    security.sudo-rs.wheelNeedsPassword = false;
    system.stateVersion = "25.05";
  };

  home.home = {
    homeDirectory = lib.mkOverride 49 "/home/${config.myconfig.constants.username}.guest";
    stateVersion = "25.05";
  };

  myconfig.services.openssh.enable = true;
}
