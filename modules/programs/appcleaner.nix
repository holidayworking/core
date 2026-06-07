{ delib, pkgs, ... }:
delib.module {
  name = "programs.appcleaner";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    appcleaner
  ];
}
