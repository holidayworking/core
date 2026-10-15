{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "fonts";

  options = delib.singleEnableOption host.isPC;

  nixos.ifEnabled.fonts = {
    fontconfig.defaultFonts = {
      serif = [
        "Noto Serif CJK JP"
        "Noto Color Emoji"
      ];

      sansSerif = [
        "Noto Sans CJK JP"
        "Noto Color Emoji"
      ];

      monospace = [
        "Noto Sans Mono CJK JP"
        "Noto Color Emoji"
      ];
    };

    packages = with pkgs; [ local.firple ];
  };

  darwin.ifEnabled.fonts.packages = with pkgs; [ local.firple ];
}
