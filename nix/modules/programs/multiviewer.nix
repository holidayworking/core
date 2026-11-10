{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.multiviewer";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ local.multiviewer ];
}
