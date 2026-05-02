{ delib, pkgs, ... }:
delib.module {
  name = "programs.git-now";

  home.always.home.packages = with pkgs; [
    local.git-now
  ];
}
