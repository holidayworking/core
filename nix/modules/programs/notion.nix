{ delib, pkgs, ... }:
delib.module {
  name = "programs.notion";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    notion-app
  ];
}
