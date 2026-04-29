{ delib, pkgs, ... }:
delib.module {
  name = "programs.gnumake";

  home.always.home.packages = with pkgs; [
    gnumake
  ];
}
