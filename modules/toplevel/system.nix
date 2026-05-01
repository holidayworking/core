{ delib, ... }:
delib.module {
  name = "system";

  darwin.always =
    { myconfig, ... }:
    {
      system = {
        primaryUser = myconfig.constants.username;

        defaults = {
          menuExtraClock.ShowSeconds = true;
          SoftwareUpdate.AutomaticallyInstallMacOSUpdates = true;

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
        };
      };
    };
}
