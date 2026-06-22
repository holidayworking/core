{
  delib,
  pkgs,
  lib,
  ...
}:
delib.module {
  name = "boot";

  nixos.always.boot.kernelPackages = lib.mkDefault pkgs.linuxPackages_latest;
}
