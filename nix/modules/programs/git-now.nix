{ delib, pkgs, ... }:
delib.module {
  name = "programs.git-now";

  home.always.home.packages = [ pkgs.local.git-now ];
}
