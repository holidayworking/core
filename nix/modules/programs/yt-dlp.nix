{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.yt-dlp";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = with pkgs; [ yt-dlp ];
}
