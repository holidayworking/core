{ delib, pkgs, ... }:
delib.module {
  name = "services.tailscale";

  nixos.always.services.tailscale.enable = true;

  darwin.always.environment.systemPackages = with pkgs; [ local.tailscale-gui ];
}
