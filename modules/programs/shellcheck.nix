{ delib, pkgs, ... }:
delib.module {
  name = "programs.shellcheck";

  home.always.home.packages = with pkgs; [
    shellcheck
  ];
}
