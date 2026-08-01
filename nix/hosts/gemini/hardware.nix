{
  delib,
  inputs,
  config,
  ...
}:
delib.host {
  name = "gemini";

  nixos = {
    imports = [
      inputs.disko.nixosModules.disko
    ];

    hardware.parallels.enable = true;

    boot = {
      binfmt.registrations.RosettaLinux = {
        fixBinary = true;
        interpreter = "/mnt/psf/RosettaLinux/rosetta";
        magicOrExtension = ''\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00\x00\x00\x00\x00\x02\x00\x3e\x00'';
        mask = ''\xff\xff\xff\xff\xff\xfe\xfe\x00\xff\xff\xff\xff\xff\xff\xff\xff\xfe\xff\xff\xff'';
        matchCredentials = true;
        wrapInterpreterInShell = false;
      };

      initrd.availableKernelModules = [
        "ehci_pci"
        "xhci_pci"
        "usbhid"
        "sr_mod"
      ];
    };

    disko.devices.disk.main = {
      device = "/dev/sda";
      type = "disk";

      content = {
        type = "gpt";

        partitions = {
          ESP = {
            size = "500M";
            type = "EF00";

            content = {
              format = "vfat";
              mountOptions = [ "umask=0077" ];
              mountpoint = "/boot";
              type = "filesystem";
            };
          };

          root = {
            size = "100%";

            content = {
              format = "ext4";
              mountpoint = "/";
              type = "filesystem";
            };
          };
        };
      };
    };

    nix.settings = {
      extra-platforms = [ "x86_64-linux" ];
      extra-sandbox-paths = [
        "/run/binfmt"
        "/mnt/psf/RosettaLinux"
      ];
    };

    # prlcc no longer spawns prlcp on its own, so clipboard sharing silently
    # breaks. Restore the systemd user service that nixpkgs dropped in
    # https://github.com/NixOS/nixpkgs/pull/438941.
    systemd.user.services.prlcp = {
      description = "Parallels Copy Paste Tool";
      wantedBy = [ "graphical-session.target" ];
      path = [ config.hardware.parallels.package ];
      serviceConfig = {
        ExecStart = "${config.hardware.parallels.package}/bin/prlcp";
        Restart = "always";
        WorkingDirectory = "${config.hardware.parallels.package}/bin";
      };
    };
  };
}
