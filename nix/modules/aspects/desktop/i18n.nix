{
  den.aspects.desktop.nixos = { pkgs, ... }: {
    i18n = {
      defaultLocale = "ja_JP.UTF-8";

      inputMethod = {
        enable = true;
        type = "fcitx5";

        fcitx5 = {
          addons = [ pkgs.fcitx5-mozc-ut ];

          settings = {
            globalOptions."Hotkey/DeactivateKeys"."0" = "Muhenkan";

            inputMethod = {
              GroupOrder."0" = "Default";

              "Groups/0" = {
                "Default Layout" = "us";
                DefaultIM = "mozc";
                Name = "Default";
              };

              "Groups/0/Items/0".Name = "keyboard-us";
              "Groups/0/Items/1".Name = "mozc";
            };
          };

          waylandFrontend = true;
        };
      };
    };
  };
}
