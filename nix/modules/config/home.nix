{
  delib,
  host,
  lib,
  ...
}:
delib.module {
  name = "home";

  home.always =
    { myconfig, ... }:
    let
      inherit (myconfig.constants) username;
      inherit (host) isDarwin;
    in
    {
      home = {
        inherit username;
        homeDirectory = lib.mkForce (if isDarwin then "/Users/${username}" else "/home/${username}");
      };

      targets.darwin = lib.mkIf isDarwin {
        copyApps.enable = true;
        linkApps.enable = false;
      };
    };
}
