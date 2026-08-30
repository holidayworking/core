{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.appcleaner";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    appcleaner
  ];
}
