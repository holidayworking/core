{ delib, pkgs, ... }:
delib.module {
  name = "programs.appcleaner";

  home.always.home.packages = [ pkgs.appcleaner ];
}
