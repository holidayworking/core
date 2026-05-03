{ delib, ... }:
delib.module {
  name = "services.tailscale";

  nixos.always.services.tailscale.enable = true;

  darwin.always.services.tailscale = {
    enable = true;
    overrideLocalDns = true;
  };
}
