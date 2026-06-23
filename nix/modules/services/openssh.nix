{ delib, config, ... }:
delib.module {
  name = "services.openssh";

  options = delib.singleEnableOption false;

  nixos.ifEnabled = {
    services.openssh.enable = true;

    users.users.${config.myconfig.constants.username}.openssh.authorizedKeys.keys =
      config.myconfig.constants.authorizedKeys;
  };
}
