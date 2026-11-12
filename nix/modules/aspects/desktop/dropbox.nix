{
  den.aspects.desktop = {
    nixos =
      { pkgs, ... }:
      let
        # Qt's GTK3 platform theme needs the GTK GSettings schemas, which the package doesn't wrap.
        maestral-gui = pkgs.maestral-gui.overrideAttrs (old: {
          nativeBuildInputs = old.nativeBuildInputs ++ [ pkgs.wrapGAppsHook3 ];
          buildInputs = old.buildInputs ++ [ pkgs.gtk3 ];
          dontWrapGApps = true;

          preFixup = (old.preFixup or "") + ''
            makeWrapperArgs+=("''${gappsWrapperArgs[@]}")
          '';
        });
      in
      {
        environment.systemPackages = [ maestral-gui ];
      };

    darwin = { pkgs, ... }: {
      environment.systemPackages = [ pkgs.local.dropbox ];
    };

    homeManager =
      { lib, pkgs, ... }:
      {
        xdg.autostart = lib.mkIf pkgs.stdenv.hostPlatform.isLinux {
          enable = true;

          entries = [
            # Delay startup like Maestral's own login item so the tray is ready.
            "${
              pkgs.makeDesktopItem {
                name = "maestral";
                desktopName = "Maestral";
                exec = "maestral_qt";
                icon = "maestral";
                extraConfig."X-GNOME-Autostart-Delay" = "2";
              }
            }/share/applications/maestral.desktop"
          ];
        };
      };
  };
}
