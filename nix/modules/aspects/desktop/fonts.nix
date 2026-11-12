{
  den.aspects.desktop = {
    os = { pkgs, ... }: { fonts.packages = [ pkgs.local.firple ]; };

    nixos.fonts.fontconfig.defaultFonts = {
      monospace = [
        "Noto Sans Mono CJK JP"
        "Noto Color Emoji"
      ];

      sansSerif = [
        "Noto Sans CJK JP"
        "Noto Color Emoji"
      ];

      serif = [
        "Noto Serif CJK JP"
        "Noto Color Emoji"
      ];
    };
  };
}
