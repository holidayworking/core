{ delib, pkgs, ... }:
delib.module {
  name = "programs.git";

  home.always.home = {
    packages = with pkgs; [
      git
    ];

    file = {
      ".gitconfig".source = ../../dotfiles/.gitconfig;
      ".gitignore_global".source = ../../dotfiles/.gitignore_global;
    };
  };
}
