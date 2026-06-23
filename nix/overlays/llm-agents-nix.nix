{ delib, inputs, ... }:
delib.overlayModule {
  name = "llm-agents-nix";
  overlay = inputs.llm-agents-nix.overlays.default;
}
