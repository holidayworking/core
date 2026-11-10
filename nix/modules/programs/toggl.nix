{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.toggl";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ local.toggl ];
}
