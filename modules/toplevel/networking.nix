{ delib, host, ... }:
delib.module {
  name = "networking";

  nixos.always.networking.hostName = host.name;

  darwin.always = {
    networking = {
      computerName = host.name;
      hostName = host.name;
    };
  };
}
