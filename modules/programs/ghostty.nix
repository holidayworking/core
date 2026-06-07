{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.ghostty";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.programs.ghostty = {
    enable = true;
    enableZshIntegration = false;
    package = if pkgs.stdenv.isDarwin then pkgs.ghostty-bin else pkgs.ghostty;

    settings = {
      font-family = "FiraCode Nerd Font";
      font-size = "14";
      theme = "GitHub Dark Default";
      shell-integration-features = "no-path,ssh-env,ssh-terminfo";
    };
  };
}
