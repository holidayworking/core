{ delib, pkgs, ... }:
delib.module {
  name = "programs.claude-code";

  home.always.programs.claude-code = {
    enable = true;
    package = pkgs.llm-agents.claude-code;

    enableMcpIntegration = true;

    settings = {
      defaultMode = "plan";
      enableAllProjectMcpServers = true;
      language = "japanese";
      theme = "auto";

      sandbox = {
        enable = true;
        allowUnsandboxedCommands = true;
        failIfUnavailable = true;
      };

      statusLine = {
        command = "${pkgs.lib.getExe' pkgs.llm-agents.ccusage "ccusage"} statusline";
        type = "command";
      };
    };
  };
}
