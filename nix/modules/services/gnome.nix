{
  delib,
  host,
  lib,
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
        gnomeExtensions.kiwi-is-not-apple
        gnomeExtensions.kiwi-menu
        gnomeExtensions.pop-shell
        gnomeExtensions.xremap
        loupe
        nautilus
        pop-launcher
      ];
    };

    programs.dconf.profiles.gdm.databases = [
      {
        settings."org/gnome/desktop/interface".scaling-factor = lib.gvariant.mkUint32 2;
      }
    ];

    services = {
      desktopManager.gnome.enable = true;
      displayManager.gdm.enable = true;
      gnome.core-apps.enable = false;
    };
  };

  home.ifEnabled = {
    dconf.settings = {
      "org/gnome/desktop/wm/preferences".button-layout = "appmenu:minimize,maximize,close";
      "org/gnome/mutter".overlay-key = "";
      "org/gnome/mutter/wayland/keybindings".restore-shortcuts = [ ];
      "org/gnome/nautilus/icon-view".default-zoom-level = "small";
      "org/gnome/shell/extensions/pop-shell".activate-launcher = [ "<Super>space" ];
      "org/gnome/shell/extensions/kiwimenu".icon = 9;

      "org/gnome/desktop/interface" = {
        color-scheme = "prefer-dark";
        scaling-factor = lib.gvariant.mkUint32 2;
      };

      "org/gnome/desktop/wm/keybindings" = {
        activate-window-menu = [ ];
        begin-move = [ ];
        begin-resize = [ ];
        close = [ "<Super>q" ];
        cycle-group = [ ];
        cycle-group-backward = [ ];
        cycle-panels = [ ];
        cycle-panels-backward = [ ];
        cycle-windows = [ ];
        cycle-windows-backward = [ ];
        maximize = [ ];
        minimize = [ ];
        move-to-monitor-down = [ ];
        move-to-monitor-left = [ ];
        move-to-monitor-right = [ ];
        move-to-monitor-up = [ ];
        move-to-workspace-1 = [ ];
        move-to-workspace-last = [ ];
        move-to-workspace-left = [ ];
        move-to-workspace-right = [ ];
        panel-run-dialog = [ ];
        switch-applications = [ ];
        switch-applications-backward = [ ];
        switch-group = [ ];
        switch-group-backward = [ ];
        switch-input-source = [ ];
        switch-input-source-backward = [ ];
        switch-panels = [ ];
        switch-panels-backward = [ ];
        switch-to-workspace-1 = [ ];
        switch-to-workspace-last = [ ];
        switch-to-workspace-left = [ ];
        switch-to-workspace-right = [ ];
        switch-windows = [ ];
        switch-windows-backward = [ ];
        toggle-maximized = [ ];
        unmaximize = [ ];
      };

      "org/gnome/settings-daemon/plugins/media-keys" = {
        logout = [ ];
        screensaver = [ ];
      };

      "org/gnome/shell" = {
        always-show-log-out = true;
        disable-user-extensions = false;
        enabled-extensions = with pkgs.gnomeExtensions; [
          appindicator.extensionUuid
          dash-to-dock.extensionUuid
          kimpanel.extensionUuid
          kiwi-is-not-apple.extensionUuid
          kiwi-menu.extensionUuid
          pop-shell.extensionUuid
          xremap.extensionUuid
        ];
        favorite-apps = [
          "org.gnome.Nautilus.desktop"
          "google-chrome.desktop"
          "foot.desktop"
        ];
      };

      "org/gnome/shell/extensions/dash-to-dock" = {
        disable-overview-on-startup = true;
        dock-fixed = true;
        show-favorites = true;
        show-mounts = false;
        show-show-apps-button = false;
      };

      "org/gnome/shell/extensions/kiwi" = {
        battery-percentage = false;
        custom-dnd-button = false;
        dock-blur = false;
        enable-app-window-buttons = false;
        enable-firefox-styling = false;
        enable-thunderbird-styling = false;
        hide-activities-button = true;
        hide-minimized-windows = false;
        keyboard-indicator = false;
        move-calendar-right = false;
        move-window-to-new-workspace = false;
        overview-wallpaper-background = false;
        panel-hover-fullscreen = false;
        panel-transparency = false;
        show-window-controls = false;
        show-window-title = false;
        skip-overview-on-login = true;
        transparent-move = false;
      };

      "org/gnome/shell/keybindings" = {
        focus-active-notification = [ ];
        screenshot = [ "<Shift><Super>3" ];
        screenshot-window = [ "<Shift><Super>4" ];
        show-screen-recording-ui = [ ];
        show-screenshot-ui = [ "<Shift><Super>5" ];
        toggle-application-view = [ ];
        toggle-message-tray = [ ];
        toggle-quick-settings = [ ];
      };
    };
  };
}
