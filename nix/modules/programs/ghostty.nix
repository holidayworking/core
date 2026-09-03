{ delib, pkgs, ... }:
delib.module {
  name = "programs.ghostty";

  home.always.programs.ghostty = {
    enable = true;
    enableZshIntegration = false;
    package = pkgs.ghostty-bin;

    settings = {
      font-family = "FiraCode Nerd Font";
      font-size = "14";
      theme = "GitHub Dark Default";
      shell-integration-features = "no-path,ssh-env,ssh-terminfo";
    };
  };
}
