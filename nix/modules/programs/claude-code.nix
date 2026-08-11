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
      imports = [
        (
          { config, ... }:
          {
            programs.claude-code.settings.otelHeadersHelper = config.sops.templates."otlp-headers-helper".path;
          }
        )
      ];

      programs.claude-code = {
        enable = true;
        package = pkgs.llm-agents.claude-code;

        enableMcpIntegration = true;

        settings = {
          enableAllProjectMcpServers = true;
          language = "japanese";
          permissions.defaultMode = "plan";
          theme = "auto";

          enabledPlugins = {
            "deploy-on-aws@agent-plugins-for-aws" = true;
            "claude-code-setup@claude-plugins-official" = true;
            "claude-md-management@claude-plugins-official" = true;
            "code-simplifier@claude-plugins-official" = true;
            "commit-commands@claude-plugins-official" = true;
            "crit@crit" = true;
          };

          env = {
            CLAUDE_CODE_ENABLE_TELEMETRY = "1";
            OTEL_METRICS_EXPORTER = "otlp";
            OTEL_EXPORTER_OTLP_PROTOCOL = "http/protobuf";
            OTEL_EXPORTER_OTLP_METRICS_ENDPOINT = "https://monitoring.ap-northeast-1.amazonaws.com/v1/metrics";
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
