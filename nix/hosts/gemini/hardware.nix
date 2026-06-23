{
  delib,
  inputs,
  lib,
  ...
}:
delib.host {
  name = "gemini";

  nixos = {
    imports = [
      inputs.nixos-lima.nixosModules.lima
    ];

    boot.loader.grub = {
      device = "nodev";
      efiSupport = true;
      efiInstallAsRemovable = true;
    };

    fileSystems."/boot" = {
      device = lib.mkForce "/dev/vda1"; # /dev/disk/by-label/ESP
      fsType = "vfat";
    };

    fileSystems."/" = {
      device = "/dev/disk/by-label/nixos";
      autoResize = true;
      fsType = "ext4";
      options = [
        "discard"
        "noatime"
        "nodiratime"
      ];
    };

    security.sudo.wheelNeedsPassword = false;

    services.lima.enable = true;
  };
}
