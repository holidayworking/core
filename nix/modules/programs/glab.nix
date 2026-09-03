{ delib, pkgs, ... }:
delib.module {
  name = "programs.glab";

  home.always.home.packages = [ pkgs.glab ];
}
