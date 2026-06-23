{ delib, ... }:
let
  shared.nix = {
    optimise.automatic = true;

    settings = {
      experimental-features = [
        "flakes"
        "nix-command"
      ];
      extra-substituters = [ "https://cache.numtide.com" ];
      extra-trusted-public-keys = [ "niks3.numtide.com-1:DTx8wZduET09hRmMtKdQDxNNthLQETkc/yaX7M4qK0g=" ];
    };
  };
in
delib.module {
  name = "nix";

  nixos.always = shared;

  darwin.always.nix = shared.nix // {
    gc.automatic = true;
  };
}
