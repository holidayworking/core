{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.1password-gui";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled = {
    homebrew.masApps."1Password for Safari" = 1569813296;

    # Nixpkgs 1password-gui is too old, so install via brew-nix instead.
    programs._1password-gui = {
      enable = true;
      package = pkgs.brewCasks."1password";
    };
  };
}
