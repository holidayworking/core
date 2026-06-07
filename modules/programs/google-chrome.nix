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
    package =
      if pkgs.stdenv.isDarwin then
        # Nixpkgs google-chrome is marked insecure (out of date), so on Darwin install via brew-nix instead.
        (pkgs.brewCasks.google-chrome.overrideAttrs (oldAttrs: {
          src = pkgs.fetchurl {
            url = builtins.head oldAttrs.src.urls;
            hash = "sha256-F6IZbEWdol1SZ967m+5u9deBHtXNptDxLBZKtOfi8no=";
          };
        }))
      else
        pkgs.chromium;
  };
}
