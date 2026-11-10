{
  delib,
  host,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.dropbox";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled =
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
      home.packages = [ (if host.isDarwin then pkgs.local.dropbox else maestral-gui) ];

      xdg.autostart = lib.mkIf host.isLinux {
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
}
