{
  delib,
  host,
  pkgs,
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
      home.homeDirectory = pkgs.lib.mkForce (
        if isDarwin then "/Users/${username}" else "/home/${username}"
      );

      targets.darwin = pkgs.lib.mkIf isDarwin {
        copyApps.enable = true;
        linkApps.enable = false;
      };
    };
}
