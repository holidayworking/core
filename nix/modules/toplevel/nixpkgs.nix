{
  delib,
  inputs,
  pkgs,
  ...
}:
let
  shared = {
    nixpkgs.config.allowUnfree = true;

    _module.args.pkgs-master = import inputs.nixpkgs-master {
      system = pkgs.stdenv.hostPlatform.system;
      config.allowUnfree = true;
    };
  };
in
delib.module {
  name = "nixpkgs";

  nixos.always = shared;
  darwin.always = shared;
  home.always = shared;
}
