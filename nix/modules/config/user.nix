{ delib, pkgs, ... }:
delib.module {
  name = "user";

  nixos.always =
    { myconfig, ... }:
    let
      inherit (myconfig.constants) username userfullname;
    in
    {
      users = {
        groups.${username} = {
          gid = 1000;
        };

        users.${username} = {
          description = userfullname;
          extraGroups = [
            "wheel"
          ];
          group = username;
          isNormalUser = true;
          shell = pkgs.zsh;
          uid = 1000;
        };
      };
    };

  darwin.always =
    { myconfig, ... }:
    let
      inherit (myconfig.constants) username;
    in
    {
      users.users.${username}.home = "/Users/${username}";
    };
}
