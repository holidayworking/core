{ delib, ... }:
delib.module {
  name = "programs.jq";

  home.always.programs.jq.enable = true;
}
