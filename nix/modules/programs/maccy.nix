{ delib, pkgs, ... }:
delib.module {
  name = "programs.maccy";

  home.always.home.packages = [ pkgs.maccy ];
}
