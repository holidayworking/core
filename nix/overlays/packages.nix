{ delib, inputs, ... }:
delib.overlayModule {
  name = "local-packages";
  overlay = _final: prev: {
    local =
      let
        # Sources tracked by nvfetcher (nix/sources/nvfetcher.toml).
        sources = prev.callPackage ../sources/generated/generated.nix { };
      in
      prev.lib.listToAttrs (
        map (path: {
          name = baseNameOf (dirOf path);
          value = prev.callPackage path {
            inherit inputs sources;
          };
        }) (inputs.denix.lib.umport { path = ../packages; })
      );
  };
}
