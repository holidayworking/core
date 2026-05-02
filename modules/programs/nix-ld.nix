{ delib, ... }:
delib.module {
  name = "programs.nix-ld";

  nixos.always.programs.nix-ld.enable = true;
}
