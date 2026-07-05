{ delib, inputs, ... }:
delib.host {
  name = "gemini";

  nixos = {
    imports = [
      inputs.nixos-lima.nixosModules.lima
    ];

    boot.loader.systemd-boot.enable = true;
    security.sudo-rs.wheelNeedsPassword = false;
    services.lima.enable = true;

    fileSystems = {
      "/boot" = {
        device = "/dev/disk/by-label/ESP";
        fsType = "vfat";
      };

      "/" = {
        autoResize = true;
        device = "/dev/disk/by-label/nixos";
        fsType = "ext4";
      };
    };
  };
}
