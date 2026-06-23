{ delib, pkgs, ... }:
delib.module {
  name = "programs.nixfmt";

  home.always.home.packages = with pkgs; [
    nixfmt
  ];
}
