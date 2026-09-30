{ delib, ... }:
delib.host {
  name = "taurus";

  system = "aarch64-darwin";
  type = "laptop";

  darwin.system.stateVersion = 5;

  home.home.stateVersion = "25.05";
}
