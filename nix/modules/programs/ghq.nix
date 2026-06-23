{ delib, pkgs, ... }:
delib.module {
  name = "programs.ghq";

  home.always.home.packages = with pkgs; [
    ghq
  ];
}
