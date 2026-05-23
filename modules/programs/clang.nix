{ delib, pkgs, ... }:
delib.module {
  name = "programs.clang";

  home.always.home.packages = with pkgs; [
    clang
  ];
}
