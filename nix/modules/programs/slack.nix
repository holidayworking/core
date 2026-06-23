{ delib, pkgs, ... }:
delib.module {
  name = "programs.slack";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    slack
  ];
}
