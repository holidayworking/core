{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.toggl";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [ local.toggl ];
}
