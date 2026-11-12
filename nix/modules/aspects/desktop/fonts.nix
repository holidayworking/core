{
  den.aspects.desktop = {
    nixos = { pkgs, ... }: {
      fonts = {
        fontconfig.defaultFonts = {
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

        packages = [ pkgs.local.firple ];
      };
    };

    darwin = { pkgs, ... }: { fonts.packages = [ pkgs.local.firple ]; };
  };
}
