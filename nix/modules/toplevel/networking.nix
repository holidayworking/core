{ delib, host, ... }:
delib.module {
  name = "networking";

  darwin.always.networking = {
    computerName = host.name;
    hostName = host.name;
  };
}
