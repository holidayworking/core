{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "i18n";

  options = delib.singleEnableOption (host.isPC && host.isLinux);

  nixos.ifEnabled.i18n = {
    defaultLocale = "ja_JP.UTF-8";

    inputMethod = {
      enable = true;
      type = "fcitx5";

      fcitx5 = {
        waylandFrontend = true;

        addons = [ pkgs.fcitx5-mozc-ut ];

        settings = {
          globalOptions."Hotkey/DeactivateKeys"."0" = "Muhenkan";

          inputMethod = {
            GroupOrder."0" = "Default";
            "Groups/0/Items/0".Name = "keyboard-us";
            "Groups/0/Items/1".Name = "mozc";

            "Groups/0" = {
              Name = "Default";
              "Default Layout" = "us";
              DefaultIM = "mozc";
            };
          };
        };
      };
    };
  };
}
