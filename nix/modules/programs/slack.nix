{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.slack";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ slack ];
}
