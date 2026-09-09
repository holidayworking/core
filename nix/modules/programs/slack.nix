{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.slack";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = with pkgs; [ slack ];
}
