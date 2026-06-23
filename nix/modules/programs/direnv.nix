{ delib, ... }:
delib.module {
  name = "programs.direnv";

  home.always.programs.direnv.enable = true;
}
