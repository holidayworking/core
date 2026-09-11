{ delib, pkgs, ... }:
delib.module {
  name = "fonts";

  darwin.always.fonts.packages = [ pkgs.local.firple ];
}
