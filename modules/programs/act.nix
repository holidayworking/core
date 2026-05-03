{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.act";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.home.packages = with pkgs; [
    act
  ];
}
