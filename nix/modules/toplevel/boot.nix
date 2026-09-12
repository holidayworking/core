{
  delib,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "boot";

  nixos.always.boot.kernelPackages = lib.mkDefault pkgs.linuxPackages_latest;
}
