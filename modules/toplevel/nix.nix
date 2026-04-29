{ delib, ... }:
let
  shared = {
    nix = {
      settings.experimental-features = [
        "flakes"
        "nix-command"
      ];
    };
  };
in
delib.module {
  name = "nix";

  nixos.always = shared;
  darwin.always = shared;
}
