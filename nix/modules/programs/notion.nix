{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.notion";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ notion-app ];
}
