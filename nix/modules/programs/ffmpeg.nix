{ delib, pkgs, ... }:
delib.module {
  name = "programs.ffmpeg";

  home.always.home.packages = with pkgs; [
    ffmpeg
  ];
}
