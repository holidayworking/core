{ delib, ... }:
delib.module {
  name = "services.tailscale";

  nixos.always.services.tailscale.enable = true;
}
