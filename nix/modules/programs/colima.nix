{ delib, pkgs, ... }:
delib.module {
  name = "programs.colima";

  home.always.home.packages = [ pkgs.colima ];
}
