{ delib, ... }:
delib.module {
  name = "security";

  nixos.always.security.sudo-rs = {
    enable = true;
    wheelNeedsPassword = false;
  };
}
