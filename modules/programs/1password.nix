{ delib, ... }:
delib.module {
  name = "programs.1password";

  nixos.always.programs._1password.enable = true;
}
