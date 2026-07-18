{
  delib,
  ...
}:
delib.host {
  name = "sakura";

  system = "aarch64-linux";
  type = "desktop";

  nixos = {
    security.sudo-rs.wheelNeedsPassword = false;
    system.stateVersion = "25.05";
  };

  home.home.stateVersion = "25.05";

  myconfig = {
    programs = {
      foot.enable = true;
      ghostty.enable = false;
    };

    services.openssh.enable = true;
  };
}
