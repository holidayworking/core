{ delib, pkgs, ... }:
delib.module {
  name = "programs.maccy";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    maccy
  ];
}
