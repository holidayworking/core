{ delib, host, ... }:
delib.module {
  name = "networking";

  nixos.always = {
    networking = {
      hostName = host.name;
      networkmanager.enable = true;
    };
  };

  darwin.always = {
    networking = {
      computerName = host.name;
      hostName = host.name;
    };
  };
}
