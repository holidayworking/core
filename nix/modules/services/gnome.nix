{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "services.gnome";

  options = delib.singleEnableOption (pkgs.stdenv.isLinux && host.isDesktop);

  nixos.ifEnabled = {
    environment = {
      gnome.excludePackages = with pkgs; [
        gnome-tour
      ];

      systemPackages = with pkgs; [
        gnome-tweaks
        gnomeExtensions.appindicator
        gnomeExtensions.dash-to-dock
        gnomeExtensions.kimpanel
        gnomeExtensions.pop-shell
        gnomeExtensions.no-overview
        nautilus
        pop-launcher
      ];
    };

    services = {
      desktopManager.gnome.enable = true;
      displayManager.gdm.enable = true;
      gnome.core-apps.enable = false;
    };
  };

  home.ifEnabled = {
    dconf.settings = {
      "org/gnome/desktop/interface".color-scheme = "prefer-dark";
      "org/gnome/nautilus/icon-view".default-zoom-level = "small";

      "org/gnome/shell" = {
        disable-user-extensions = false;
        enabled-extensions = with pkgs.gnomeExtensions; [
          appindicator.extensionUuid
          dash-to-dock.extensionUuid
          kimpanel.extensionUuid
          pop-shell.extensionUuid
          no-overview.extensionUuid
        ];
      };

      "org/gnome/shell/extensions/dash-to-dock" = {
        disable-overview-on-startup = true;
        dock-fixed = true;
        show-favorites = true;
        show-mounts = false;
        show-show-apps-button = false;
      };

      "org/gnome/shell/extensions/pop-shell" = {
        "activate-launcher" = [ "<Super>space" ];
      };

      "org/gnome/mutter" = {
        "overlay-key" = "";
      };
    };
  };
}
