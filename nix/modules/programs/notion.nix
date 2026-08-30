{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.notion";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    notion-app
  ];
}
