{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.slack";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    slack
  ];
}
