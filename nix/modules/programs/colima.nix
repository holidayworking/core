{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.colima";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    colima
  ];
}
