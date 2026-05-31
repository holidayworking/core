{ delib, ... }:
delib.module {
  name = "programs.claude-code";

  home.always.programs.claude-code = {
    enable = true;

    settings = {
      theme = "auto";
    };
  };
}
