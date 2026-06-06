{ delib, ... }:
delib.host {
  name = "sakura";

  system = "aarch64-linux";
  type = "server";

  nixos.system.stateVersion = "25.05";

  home.home.stateVersion = "25.05";

  myconfig.services.openssh.enable = true;
}
