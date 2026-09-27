{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.orbstack";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    orbstack
  ];
}
