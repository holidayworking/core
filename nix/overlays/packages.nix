{ delib, inputs, ... }:
delib.overlayModule {
  name = "local-packages";
  overlay = _final: prev: {
    local = prev.lib.listToAttrs (
      map (path: {
        name = baseNameOf (dirOf path);
        value = prev.callPackage path {
          inherit inputs;
        };
      }) (inputs.denix.lib.umport { path = ../packages; })
    );
  };
}
