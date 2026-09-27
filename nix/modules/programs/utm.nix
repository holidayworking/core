{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.utm";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    utm
  ];
}
