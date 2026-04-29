{ delib, ... }:
delib.module {
  name = "system";

  darwin.always =
    { myconfig, ... }:
    {
      system.primaryUser = myconfig.constants.username;
    };
}
