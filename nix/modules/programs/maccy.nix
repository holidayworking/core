{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.maccy";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ maccy ];
}
