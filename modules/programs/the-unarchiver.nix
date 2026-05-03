{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.the-unarchiver";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.home.packages = with pkgs; [
    the-unarchiver
  ];
}
