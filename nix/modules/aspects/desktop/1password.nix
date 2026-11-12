{
  den.aspects.desktop =
    { user, ... }:
    {
      nixos.programs._1password-gui = {
        enable = true;

        polkitPolicyOwners = [ user.userName ];
      };

      darwin = {
        # 1Password reads its settings from managed preferences, which override
        # the ones it writes to settings.json itself.
        managedPreferences."com.1password.1password"."updates.autoUpdate" = false;

        programs._1password-gui.enable = true;
      };

      homeManager =
        { lib, pkgs, ... }:
        {
          xdg.autostart = lib.mkIf pkgs.stdenv.hostPlatform.isLinux {
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
        };
    };
}
