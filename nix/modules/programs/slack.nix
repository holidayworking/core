{ delib, pkgs, ... }:
delib.module {
  name = "programs.slack";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    slack
  ];
}
