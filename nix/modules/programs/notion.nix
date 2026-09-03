{ delib, pkgs, ... }:
delib.module {
  name = "programs.notion";

  home.always.home.packages = [ pkgs.notion-app ];
}
