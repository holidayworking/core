{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.docker";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    docker
  ];
}
