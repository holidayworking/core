{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.the-unarchiver";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ the-unarchiver ];
}
