{ delib, pkgs, ... }:
delib.module {
  name = "programs.the-unarchiver";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    the-unarchiver
  ];
}
