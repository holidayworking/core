{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.ghostty";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.programs.ghostty = {
    enable = true;
    package = pkgs.ghostty-bin;

    enableZshIntegration = false;

    settings = {
      font-family = "FiraCode Nerd Font";
      font-size = "14";
      theme = "GitHub Dark Default";
      shell-integration-features = "no-path,ssh-env,ssh-terminfo";
    };
  };
}
