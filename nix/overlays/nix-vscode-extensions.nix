{ delib, inputs, ... }:
delib.overlayModule {
  name = "nix-vscode-extensions";
  overlay = inputs.nix-vscode-extensions.overlays.default;
}
