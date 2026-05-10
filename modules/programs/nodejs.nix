{ delib, pkgs, ... }:
delib.module {
  name = "programs.nodejs";

  home.ifEnabled.home.packages = with pkgs; [
    nodejs
  ];
}
