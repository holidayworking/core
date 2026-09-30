{
  delib,
  inputs,
  modulesPath,
  ...
}:
delib.host {
  name = "gemini";

  system = "aarch64-linux";
  type = "laptop";

  nixos =
    { myconfig, ... }:
    {
      imports = [
        (modulesPath + "/installer/scan/not-detected.nix")
        inputs.apple-silicon.nixosModules.apple-silicon-support
      ];

      boot = {
        initrd.availableKernelModules = [ "usb_storage" ];

        loader = {
          efi.canTouchEfiVariables = false;
          systemd-boot.enable = true;
        };
      };

      fileSystems = {
        "/" = {
          device = "/dev/disk/by-uuid/b1bcc273-a915-4b63-b3b5-e6d098f2c175";
          fsType = "ext4";
        };

        "/boot" = {
          device = "/dev/disk/by-uuid/B8F4-15F3";
          fsType = "vfat";
          options = [
            "fmask=0022"
            "dmask=0022"
          ];
        };
      };

      hardware.asahi = {
        enable = true;
        peripheralFirmwareDirectory = inputs.asahi-firmware;
      };

      networking.networkmanager = {
        enable = true;
        wifi.backend = "iwd";
      };

      security.sudo-rs.wheelNeedsPassword = false;

      system.stateVersion = "25.05";

      users.users.${myconfig.constants.username}.extraGroups = [ "networkmanager" ];
    };

  home.home.stateVersion = "25.05";

  myconfig.services.openssh.enable = true;
}
