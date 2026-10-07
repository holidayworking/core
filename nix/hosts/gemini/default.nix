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

      boot.loader.systemd-boot.enable = true;
      system.stateVersion = "25.05";
      users.users.${myconfig.constants.username}.extraGroups = [ "networkmanager" ];

      fileSystems = {
        "/" = {
          device = "/dev/disk/by-label/nixos";
          fsType = "ext4";
        };

        "/boot" = {
          device = "/dev/disk/by-label/EFI\\x20-\\x20NIXOS";
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
    };

  home.home.stateVersion = "25.05";

  myconfig.services.openssh.enable = true;
}
