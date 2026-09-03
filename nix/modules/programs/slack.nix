{ delib, pkgs, ... }:
delib.module {
  name = "programs.slack";

  home.always.home.packages = [ pkgs.slack ];
}
