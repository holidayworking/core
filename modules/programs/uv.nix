{ delib, pkgs, ... }:
delib.module {
  name = "programs.uv";

  home.always.home.packages = with pkgs; [
    uv
  ];
}
