{ delib, inputs, ... }:
delib.overlayModule {
  name = "nix-vite-plus";
  overlay =
    final: prev:
    let
      upstream = inputs.nix-vite-plus.overlays.default final prev;
    in
    upstream
    // {
      vite-plus = upstream.vite-plus.overrideAttrs (_old: {
        doInstallCheck = !(prev.stdenv.hostPlatform.isAarch64 && prev.stdenv.hostPlatform.isLinux);
      });
    };
}
