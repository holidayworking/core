{ delib, pkgs, ... }:
delib.module {
  name = "programs.claude-code";

  home.always.programs.claude-code = {
    enable = true;
    package = pkgs.llm-agents.claude-code;

    settings = {
      defaultMode = "plan";
      theme = "auto";

      statusLine = {
        type = "command";
        command = "${pkgs.lib.getExe' pkgs.llm-agents.ccusage "ccusage"} statusline";
      };
    };
  };
}
