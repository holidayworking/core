{ delib, pkgs, ... }:
delib.module {
  name = "programs.lima";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    lima
  ];
}
