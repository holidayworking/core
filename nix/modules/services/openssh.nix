{ delib, ... }:
delib.module {
  name = "services.openssh";

  options = delib.singleEnableOption false;

  nixos.ifEnabled =
    { myconfig, ... }:
    {
      services.openssh.enable = true;

      users.users.${myconfig.constants.username}.openssh.authorizedKeys.keys =
        myconfig.constants.authorizedKeys;
    };
}
