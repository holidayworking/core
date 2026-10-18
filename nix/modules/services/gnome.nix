{
  delib,
  host,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "services.gnome";

  options = delib.singleEnableOption (host.isPC && host.isLinux);

  nixos.ifEnabled = {
    environment.gnome.excludePackages = with pkgs; [
      baobab
      decibels
      epiphany
      gnome-calculator
      gnome-calendar
      gnome-characters
      gnome-clocks
      gnome-connections
      gnome-console
      gnome-contacts
      gnome-maps
      gnome-music
      gnome-tecla
      gnome-text-editor
      gnome-tour
      gnome-user-docs
      gnome-weather
      seahorse
      showtime
      simple-scan
      snapshot
      yelp
    ];
    fonts.fontconfig.localConf = ''
      <alias>
        <family>Adwaita Sans</family>
        <accept>
          <family>Noto Sans CJK JP</family>
        </accept>
      </alias>
    '';

    services = {
      desktopManager.gnome.enable = true;
      displayManager.gdm.enable = true;
    };
  };

  home.ifEnabled = {
    dconf.settings = {
      "org/gnome/desktop/interface".color-scheme = "prefer-dark";
      "org/gnome/desktop/peripherals/touchpad".tap-to-click = false;
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
        move-to-workspace-down = [ ];
        move-to-workspace-last = [ ];
        move-to-workspace-left = [ ];
        move-to-workspace-right = [ ];
        move-to-workspace-up = [ ];
        panel-run-dialog = [ ];
        switch-applications = [ "<Super>Tab" ];
        switch-applications-backward = [ "<Shift><Super>Tab" ];
        switch-group = [ ];
        switch-group-backward = [ ];
        switch-input-source = [ ];
        switch-input-source-backward = [ ];
        switch-panels = [ ];
        switch-panels-backward = [ ];
        switch-to-workspace-1 = [ "<Control>1" ];
        switch-to-workspace-down = [ ];
        switch-to-workspace-last = [ ];
        switch-to-workspace-left = [ ];
        switch-to-workspace-right = [ ];
        switch-to-workspace-up = [ ];
        toggle-fullscreen = [ "<Control><Super>f" ];
        toggle-maximized = [ ];
        unmaximize = [ ];
      };

      "org/gnome/mutter" = {
        experimental-features = [ "scale-monitor-framebuffer" ];
        overlay-key = "";
      };

      "org/gnome/mutter/keybindings" = {
        cancel-input-capture = [ ];
        rotate-monitor = [ ];
        switch-monitor = [ ];
        toggle-tiled-left = [ ];
        toggle-tiled-right = [ ];
      };

      "org/gnome/mutter/wayland/keybindings" = {
        restore-shortcuts = [ ];
        switch-to-session-1 = [ ];
        switch-to-session-2 = [ ];
        switch-to-session-3 = [ ];
        switch-to-session-4 = [ ];
        switch-to-session-5 = [ ];
        switch-to-session-6 = [ ];
        switch-to-session-7 = [ ];
        switch-to-session-8 = [ ];
        switch-to-session-9 = [ ];
        switch-to-session-10 = [ ];
        switch-to-session-11 = [ ];
        switch-to-session-12 = [ ];
      };

      "org/gnome/nautilus/icon-view".default-zoom-level = "small-plus";

      "org/gnome/settings-daemon/plugins/media-keys" = {
        battery-status-static = [ ];
        calculator-static = [ ];
        control-center-static = [ ];
        custom-keybindings = [
          "/org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/do-not-disturb/"
        ];
        eject-static = [ ];
        email-static = [ ];
        help = [ ];
        hibernate-static = [ ];
        home-static = [ ];
        keyboard-brightness-down-static = [ ];
        keyboard-brightness-toggle-static = [ ];
        keyboard-brightness-up-static = [ ];
        logout = [ "<Shift><Super>q" ];
        magnifier = [ ];
        magnifier-zoom-in = [ ];
        magnifier-zoom-out = [ ];
        media-static = [ ];
        pause-static = [ ];
        playback-forward-static = [ ];
        playback-random-static = [ ];
        playback-repeat-static = [ ];
        playback-rewind-static = [ ];
        power-static = [ ];
        rfkill-bluetooth-static = [ ];
        rfkill-static = [ ];
        rotate-video-lock-static = [ ];
        screenreader = [ ];
        screensaver = [ "<Control><Super>q" ];
        screensaver-static = [ ];
        search-static = [ ];
        stop-static = [ ];
        suspend-static = [ ];
        touchpad-off-static = [ ];
        touchpad-on-static = [ ];
        touchpad-toggle-static = [ ];
        volume-down-quiet-static = [ ];
        volume-mute-quiet-static = [ ];
        volume-up-quiet-static = [ ];
        www-static = [ ];
      };

      "org/gnome/settings-daemon/plugins/media-keys/custom-keybindings/do-not-disturb" = {
        binding = "XF86Sleep";
        command = toString (
          pkgs.writeShellScript "toggle-do-not-disturb" ''
            gsettings=${lib.getExe' pkgs.glib "gsettings"}
            if [ "$($gsettings get org.gnome.desktop.notifications show-banners)" = true ]; then
              $gsettings set org.gnome.desktop.notifications show-banners false
            else
              $gsettings set org.gnome.desktop.notifications show-banners true
            fi
          ''
        );
        name = "Do Not Disturb";
      };

      "org/gnome/shell" = {
        always-show-log-out = true;
        favorite-apps = [ "org.gnome.Nautilus.desktop" ];
      };

      "org/gnome/shell/extensions/dash-to-dock" = {
        dock-fixed = true;
        hot-keys = false;
        running-indicator-style = "DOT";
        show-mounts = false;
        show-show-apps-button = false;
      };

      "org/gnome/shell/extensions/kiwi" = {
        battery-percentage = false;
        custom-dnd-button = false;
        enable-app-window-buttons = false;
        keyboard-indicator = false;
        lock-icon = false;
        move-calendar-right = false;
        overview-seamless-zoom = false;
        panel-hover-fullscreen = true;
        panel-styling = false;
        popup-menu-styling = false;
        reduce-window-animations = false;
        show-window-controls = false;
        show-window-title = false;
        skip-overview-on-login = true;
        transparent-move = false;
      };

      "org/gnome/shell/keybindings" = {
        focus-active-notification = [ ];
        open-new-window-application-1 = [ ];
        open-new-window-application-2 = [ ];
        open-new-window-application-3 = [ ];
        open-new-window-application-4 = [ ];
        open-new-window-application-5 = [ ];
        open-new-window-application-6 = [ ];
        open-new-window-application-7 = [ ];
        open-new-window-application-8 = [ ];
        open-new-window-application-9 = [ ];
        screen-brightness-cycle = [ ];
        screen-brightness-cycle-monitor = [ ];
        screen-brightness-down-monitor = [ ];
        screen-brightness-up-monitor = [ ];
        screenshot = [ "<Shift><Super>3" ];
        screenshot-window = [ ];
        shift-overview-down = [ ];
        shift-overview-up = [ ];
        show-screen-recording-ui = [ ];
        show-screenshot-ui = [
          "<Shift><Super>4"
          "<Shift><Super>5"
        ];
        switch-to-application-1 = [ ];
        switch-to-application-2 = [ ];
        switch-to-application-3 = [ ];
        switch-to-application-4 = [ ];
        switch-to-application-5 = [ ];
        switch-to-application-6 = [ ];
        switch-to-application-7 = [ ];
        switch-to-application-8 = [ ];
        switch-to-application-9 = [ ];
        toggle-application-view = [
          "<Super>space"
          "XF86Search"
        ];
        toggle-overview = [ "XF86LaunchA" ];
        toggle-message-tray = [ ];
        toggle-quick-settings = [ ];
      };
    };

    programs.gnome-shell = {
      enable = true;
      extensions = map (package: { inherit package; }) (
        with pkgs.gnomeExtensions;
        [
          appindicator
          dash-to-dock
          kimpanel
          kiwi-is-not-apple
          user-themes
          xremap
        ]
      );
    };

    xdg = {
      autostart = {
        enable = true;
        entries = [
          "${
            pkgs.makeDesktopItem {
              name = "1password";
              desktopName = "1Password";
              exec = "1password --silent";
              icon = "1password";
            }
          }/share/applications/1password.desktop"
        ];
      };

      userDirs = {
        enable = true;
        createDirectories = true;
        setSessionVariables = false;
      };
    };
  };
}
