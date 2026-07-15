{ delib, ... }:
let
  shared.nixpkgs.config.allowUnfree = true;
in
delib.module {
  name = "nixpkgs";

  nixos.always = shared;
  darwin.always = shared;
  home.always = shared;
}
