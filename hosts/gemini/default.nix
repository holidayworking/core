{ delib, ... }:
delib.host {
  name = "gemini";

  system = "aarch64-linux";
  type = "server";

  nixos.system.stateVersion = "25.05";

  home.home.stateVersion = "25.05";
}
