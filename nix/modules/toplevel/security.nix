{ delib, ... }:
delib.module {
  name = "security";

  nixos.always.security.sudo-rs = {
    enable = true;
    wheelNeedsPassword = false;
  };

  darwin.always.security.pam.services.sudo_local = {
    reattach = true;
    touchIdAuth = true;
  };
}
