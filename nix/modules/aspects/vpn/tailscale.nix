{
  den.aspects.vpn = {
    nixos.services.tailscale.enable = true;

    # Install via installer(8); see nix/packages/tailscale-gui.
    darwin =
      { pkgs, ... }:
      let
        package = pkgs.local.tailscale-gui;
      in
      {
        system.activationScripts.postActivation.text = ''
          if [ "$(pkgutil --pkg-info com.tailscale.ipn.macsys 2>/dev/null | sed -n 's/^version: //p')" != "${package.version}" ]; then
            installer -pkg "${package.src}" -target /
          fi
        '';
      };
  };
}
