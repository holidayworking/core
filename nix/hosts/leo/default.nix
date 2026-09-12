{ delib, inputs, ... }:
delib.host {
  name = "leo";

  system = "aarch64-linux";
  type = "server";

  nixos = {
    imports = [
      "${inputs.nixpkgs}/nixos/maintainers/scripts/ec2/amazon-image.nix"
    ];

    amazonImage.format = "raw";
    ec2.efi = true;
    security.sudo-rs.wheelNeedsPassword = false;
    system.stateVersion = "25.05";
    virtualisation.diskSize = 8 * 1024;
  };

  home.home.stateVersion = "25.05";

  myconfig.services.openssh.enable = true;
}
