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

      enabledPlugins = {
        "claude-code-setup@claude-plugins-official" = true;
        "claude-md-management@claude-plugins-official" = true;
        "claude-notifications-go@claude-notifications-go" = true;
        "code-simplifier@claude-plugins-official" = true;
        "commit-commands@claude-plugins-official" = true;
      };

      extraKnownMarketplaces = {
        "claude-notifications-go" = {
          source = {
            source = "github";
            repo = "777genius/claude-notifications-go";
          };
        };
      };

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
