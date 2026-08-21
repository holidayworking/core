{
  delib,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "boot";

  nixos.always.boot = {
    loader.systemd-boot.enable = true;
    kernelPackages = lib.mkDefault pkgs.linuxPackages_latest;
  };
}
