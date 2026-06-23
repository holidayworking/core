{ delib, pkgs, ... }:
delib.module {
  name = "programs.shfmt";

  home.always.home.packages = with pkgs; [
    shfmt
  ];
}
