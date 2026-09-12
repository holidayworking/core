{ delib, ... }:
delib.module {
  name = "services.tailscale";

  nixos.always.services.tailscale.enable = true;

  darwin.always.homebrew.casks = [
    "tailscale-app"
  ];
}
