{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.google-chrome";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.programs.chromium = {
    enable = true;
    # Nixpkgs google-chrome is marked insecure (out of date), so on Darwin install via brew-nix instead.
    package = pkgs.brewCasks.google-chrome.overrideAttrs (oldAttrs: {
      src = pkgs.fetchurl {
        url = builtins.head oldAttrs.src.urls;
        hash = "sha256-Yej/s4wipwQd/Vp5b+sSpwXNEXTZ07hAcqfV6e1cIis=";
      };
    });
  };
}
