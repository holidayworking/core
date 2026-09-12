{ delib, pkgs, ... }:
delib.module {
  name = "fonts";

  darwin.always.fonts.packages = with pkgs; [ local.firple ];
}
