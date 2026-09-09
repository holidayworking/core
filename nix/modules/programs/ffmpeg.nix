{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.ffmpeg";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = with pkgs; [ ffmpeg ];
}
