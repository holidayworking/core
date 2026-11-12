{
  den.aspects.vpn = {
    nixos.services.tailscale.enable = true;

    darwin = { pkgs, ... }: {
      environment.systemPackages = with pkgs; [ local.tailscale-gui ];
    };
  };
}
