{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.radigo";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = with pkgs; [ local.radigo ];
}
