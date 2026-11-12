{ sources, ... }:
# sysextd only activates the network extension once it can confirm
# notarization, and the bundle carries no stapled ticket: the ticket is
# registered only when the official package goes through installer(8).
# Extracting the payload into the Nix store skips that, so the extension fails
# with OSSystemExtensionErrorCodeSignatureInvalid. Only expose the official
# installer package (src) here and let the vpn aspect
# (nix/modules/aspects/vpn/tailscale.nix) install it with installer(8).
sources.tailscale-gui
