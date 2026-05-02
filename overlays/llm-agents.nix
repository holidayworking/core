{ delib, inputs, ... }:
delib.overlayModule {
  name = "llm-agents";
  overlay = inputs.llm-agents.overlays.default;
}
