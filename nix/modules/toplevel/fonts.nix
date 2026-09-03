{ delib, pkgs, ... }:
delib.module {
  name = "fonts";

  darwin.always.fonts.packages = [ pkgs.nerd-fonts.fira-code ];
}
