{ delib, pkgs, ... }:
delib.module {
  name = "programs.nodejs";

  home.always.home.packages = with pkgs; [
    nodejs
  ];
}
