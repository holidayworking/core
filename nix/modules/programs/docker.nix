{ delib, pkgs, ... }:
delib.module {
  name = "programs.docker";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    docker
  ];
}
