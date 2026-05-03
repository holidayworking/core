{ delib, inputs, ... }:
delib.overlayModule {
  name = "nix-vite-plus";
  overlay = inputs.nix-vite-plus.overlays.default;
}
