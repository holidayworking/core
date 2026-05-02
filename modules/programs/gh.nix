{ delib, ... }:
delib.module {
  name = "programs.gh";

  home.always.programs.gh = {
    enable = true;
    settings.git_protocol = "ssh";
  };
}
