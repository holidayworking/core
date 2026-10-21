{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.duckstation";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = with pkgs; [ local.duckstation ];
}
