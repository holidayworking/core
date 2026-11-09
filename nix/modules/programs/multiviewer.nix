{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.multiviewer";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [ local.multiviewer ];
}
