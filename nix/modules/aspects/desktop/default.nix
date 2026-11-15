{
  den.aspects.desktop = {
    darwin = {
      managedPreferences = {
        "com.tinyspeck.slackmacgap".AutoUpdate = false;
        "notion.id".NotionNoAutoUpdates = true;
      };

      programs.mas = {
        enable = true;
        packages."1Password for Safari" = 1569813296;
        update = false;
      };

      security.pam.services.sudo_local = {
        reattach = true;
        touchIdAuth = true;
      };

      system.defaults = {
        CustomUserPreferences = {
          "com.apple.Safari" = {
            AutoFillPasswords = false;
            AutoOpenSafeDownloads = false;
            IncludeDevelopMenu = true;
            WebKitDeveloperExtrasEnabledPreferenceKey = true;
            "WebKitPreferences.developerExtrasEnabled" = true;
          };

          "com.apple.Safari.SandboxBroker".ShowDevelopMenu = true;
        };

        dock = {
          minimize-to-application = true;
          mru-spaces = false;
          show-recents = false;
          wvous-bl-corner = 4;
          wvous-br-corner = 5;
          wvous-tl-corner = 2;
          wvous-tr-corner = 3;
        };

        finder = {
          FXRemoveOldTrashItems = true;
          NewWindowTarget = "Home";
          ShowExternalHardDrivesOnDesktop = false;
          ShowRemovableMediaOnDesktop = false;
        };

        menuExtraClock.ShowSeconds = true;
      };
    };

    homeManager = { lib, pkgs, ... }: {
      home.packages =
        with pkgs;
        [
          ffmpeg
          local.duckstation
          local.radigo
        ]
        ++ lib.optionals pkgs.stdenv.hostPlatform.isDarwin [
          (appcleaner.overrideAttrs (old: {
            # The upstream zip ships Finder's __MACOSX metadata, which would otherwise
            # be copied into ~/Applications/Home Manager Apps next to the app.
            postInstall = (old.postInstall or "") + "rm -rf $out/Applications/__MACOSX\n";
          }))
          local.multiviewer
          maccy
          notion-app
          orbstack
          slack
          terminal-notifier
          the-unarchiver
          utm
        ];

      programs = {
        google-chrome.enable = true;

        herdr.plugins = lib.optionals pkgs.stdenv.hostPlatform.isDarwin [
          pkgs.local.herdr-terminal-notifier
        ];

        yt-dlp.enable = true;
      };

      # Bring Ghostty to the front after focusing the agent's pane, so clicking a
      # notification also works while another app is in front. The plugin runs
      # this through a shell, so `;` chains the second command.
      xdg.configFile."herdr/plugins/config/dot.terminal-notifier/config.env" =
        lib.mkIf pkgs.stdenv.hostPlatform.isDarwin
          {
            text = "CLICK_COMMAND='agent focus {pane}; /usr/bin/open -b com.mitchellh.ghostty'\n";
          };
    };
  };
}
