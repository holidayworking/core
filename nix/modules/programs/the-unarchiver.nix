{ delib, pkgs, ... }:
delib.module {
  name = "programs.the-unarchiver";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    the-unarchiver
  ];
}
