{ delib, pkgs, ... }:
delib.module {
  name = "programs.claude-code";

  options = delib.singleEnableOption true;

  home.ifEnabled =
    let
      mkNotifierHook = suffix: extra: [
        (
          {
            hooks = [
              {
                type = "command";
                command = "node ~/.claude/hooks/claude-notifier-on-${suffix}.js";
              }
            ];
          }
          // extra
        )
      ];
    in
    {
      programs.claude-code = {
        enable = true;
        package = pkgs.llm-agents.claude-code;

        enableMcpIntegration = true;

        settings = {
          enableAllProjectMcpServers = true;
          permissions.defaultMode = "plan";
          language = "japanese";
          theme = "auto";

          enabledPlugins = {
            "deploy-on-aws@agent-plugins-for-aws" = true;
            "claude-code-setup@claude-plugins-official" = true;
            "claude-md-management@claude-plugins-official" = true;
            "code-simplifier@claude-plugins-official" = true;
            "codex@openai-codex" = true;
            "commit-commands@claude-plugins-official" = true;
            "crit@crit" = true;
          };

          extraKnownMarketplaces = {
            "agent-plugins-for-aws".source = {
              source = "github";
              repo = "awslabs/agent-plugins";
            };

            "crit".source = {
              source = "github";
              repo = "tomasz-tomczyk/crit";
            };

            "openai-codex".source = {
              source = "github";
              repo = "openai/codex-plugin-cc";
            };
          };

          hooks = {
            Stop = mkNotifierHook "stop" { };
            PermissionRequest = mkNotifierHook "permission" { };
            PreToolUse = mkNotifierHook "question" { matcher = "AskUserQuestion"; };
            UserPromptSubmit = mkNotifierHook "prompt" { };
            SubagentStop = mkNotifierHook "subagent-stop" { };
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
    };
}
