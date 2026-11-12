{
  den.aspects.ai.homeManager =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      mkNotifierHook = suffix: extra: [
        (
          {
            hooks = [
              {
                type = "command";
                command = "${lib.getExe pkgs.nodejs_24} ~/.claude/hooks/claude-notifier-on-${suffix}.js";
              }
            ];
          }
          // extra
        )
      ];
    in
    {
      programs = {
        claude-code = {
          enable = true;
          package = pkgs.llm-agents.claude-code;
          enableMcpIntegration = true;

          settings = {
            attribution.sessionUrl = false;
            enableAllProjectMcpServers = true;

            enabledPlugins = {
              "claude-code-setup@claude-plugins-official" = true;
              "claude-md-management@claude-plugins-official" = true;
              "code-simplifier@claude-plugins-official" = true;
              "commit-commands@claude-plugins-official" = true;
              "crit@crit" = true;
              "deploy-on-aws@agent-plugins-for-aws" = true;
            };

            env = {
              CLAUDE_CODE_ENABLE_TELEMETRY = "1";
              OTEL_EXPORTER_OTLP_METRICS_ENDPOINT = "https://monitoring.ap-northeast-1.amazonaws.com/v1/metrics";
              OTEL_EXPORTER_OTLP_PROTOCOL = "http/protobuf";
              OTEL_METRICS_EXPORTER = "otlp";
            };

            extraKnownMarketplaces = {
              agent-plugins-for-aws.source = {
                repo = "awslabs/agent-plugins";
                source = "github";
              };

              crit.source = {
                repo = "tomasz-tomczyk/crit";
                source = "github";
              };
            };

            hooks = {
              PermissionRequest = mkNotifierHook "permission" { };
              PreToolUse = mkNotifierHook "question" { matcher = "AskUserQuestion"; };
              Stop = mkNotifierHook "stop" { };
              SubagentStop = mkNotifierHook "subagent-stop" { };
              UserPromptSubmit = mkNotifierHook "prompt" { };
            };

            language = "japanese";
            otelHeadersHelper = config.sops.templates.otlp-headers-helper.path;
            permissions.defaultMode = "auto";

            sandbox = {
              enable = true;
              allowUnsandboxedCommands = true;
              failIfUnavailable = true;
            };

            statusLine = {
              command = "${lib.getExe pkgs.llm-agents.ccusage} statusline";
              type = "command";
            };

            theme = "auto";
          };
        };

        # deploy-on-aws@agent-plugins-for-aws invokes its MCP servers via uvx.
        uv.enable = true;
      };
    };
}
