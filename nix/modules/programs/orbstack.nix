{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.orbstack";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ orbstack ];
}
