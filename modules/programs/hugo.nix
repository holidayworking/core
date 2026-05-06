{ delib, pkgs, ... }:
delib.module {
  name = "programs.hugo";

  home.always.home.packages = with pkgs; [
    hugo
  ];
}
