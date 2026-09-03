{ delib, pkgs, ... }:
delib.module {
  name = "programs.docker";

  home.always.home.packages = [ pkgs.docker ];
}
