{ delib, ... }:
delib.host {
  name = "desktop";

  system = "aarch64-darwin";
  type = "desktop";

  darwin.system.stateVersion = 5;

  home.home.stateVersion = "25.05";
}
