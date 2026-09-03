{ delib, pkgs, ... }:
delib.module {
  name = "programs.the-unarchiver";

  home.always.home.packages = [ pkgs.the-unarchiver ];
}
