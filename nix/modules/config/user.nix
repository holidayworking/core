{ delib, ... }:
delib.module {
  name = "user";

  darwin.always =
    { myconfig, ... }:
    {
      users.users.${myconfig.constants.username}.home = myconfig.constants.homeDirectory;
    };
}
