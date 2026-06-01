{ delib, pkgs, ... }:
delib.module {
  name = "programs.claude-code";

  home.always.programs.claude-code = {
    enable = true;
    package = pkgs.llm-agents.claude-code;

    settings = {
      theme = "auto";
    };
  };
}
