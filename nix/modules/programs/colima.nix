{ delib, pkgs, ... }:
delib.module {
  name = "programs.colima";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    colima
  ];
}
