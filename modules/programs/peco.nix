{ delib, pkgs, ... }:
delib.module {
  name = "programs.peco";

  home.always.home.packages = with pkgs; [
    peco
  ];
}
