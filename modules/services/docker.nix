{ delib, ... }:
delib.module {
  name = "services.docker";

  nixos.always.virtualisation.docker.enable = true;
}
