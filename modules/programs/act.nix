{ delib, pkgs, ... }:
delib.module {
  name = "programs.act";

  home.always.home.packages = with pkgs; [
    act
  ];
}
