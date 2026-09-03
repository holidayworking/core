{ delib, lib, ... }:
delib.module {
  name = "home";

  home.always =
    { myconfig, ... }:
    {
      home.homeDirectory = lib.mkForce myconfig.constants.homeDirectory;

      targets.darwin = {
        copyApps.enable = true;
        linkApps.enable = false;
      };
    };
}
