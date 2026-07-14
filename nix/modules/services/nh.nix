{ delib, ... }:
delib.module {
  name = "services.nh";

  nixos.always.programs.nh = {
    enable = true;

    clean = {
      enable = true;
      extraArgs = "--no-direnv";
    };
  };
}
