{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.maccy";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    maccy
  ];
}
