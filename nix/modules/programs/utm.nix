{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.utm";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ utm ];
}
