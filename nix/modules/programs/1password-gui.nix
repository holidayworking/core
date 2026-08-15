{ delib, host, ... }:
delib.module {
  name = "programs.1password-gui";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled = {
    homebrew.masApps."1Password for Safari" = 1569813296;
    programs._1password-gui.enable = true;
  };
}
