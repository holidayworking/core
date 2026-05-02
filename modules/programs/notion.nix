{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.notion";

  options = delib.singleEnableOption host.isDesktop;

  # Nixpkgs notion-app is too old, so install via brew-nix instead.
  home.ifEnabled.home.packages = with pkgs; [
    brewCasks.notion
  ];
}
