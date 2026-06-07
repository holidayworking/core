{ delib, pkgs, ... }:
delib.module {
  name = "programs.notion";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  # Nixpkgs notion-app is too old, so install via brew-nix instead.
  home.ifEnabled.home.packages = with pkgs; [
    brewCasks.notion
  ];
}
