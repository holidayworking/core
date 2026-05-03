{ delib, pkgs, ... }:
delib.module {
  name = "programs.tig";

  home.always.home = {
    packages = with pkgs; [
      tig
    ];

    file.".tigrc".text = ''
      bind main R !git rebase -i %(commit)
      bind diff R !git rebase -i %(commit)
    '';
  };
}
