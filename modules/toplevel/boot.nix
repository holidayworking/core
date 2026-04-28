{
  delib,
  pkgs,
  lib,
  ...
}:
delib.module {
  name = "boot";

  nixos.always.boot = {
    kernelPackages = lib.mkDefault pkgs.linuxPackages_latest;

    loader = {
      systemd-boot.enable = true;
      efi.canTouchEfiVariables = true;
    };
  };
}
