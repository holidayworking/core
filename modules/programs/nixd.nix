{ delib, pkgs, ... }:
delib.module {
  name = "programs.nixd";

  home.always.home.packages = with pkgs; [
    nixd
  ];
}
