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
            programs = {
              claude-code.settings.otelHeadersHelper = config.sops.templates."otlp-headers-helper".path;

              # otelHeadersHelper only applies to the http/protobuf and http/json
              # OTLP protocols; the grpc exporter (used for metrics, since Mackerel
              # only accepts OTLP metrics over grpc) only reads the static
              # OTEL_EXPORTER_OTLP_HEADERS env var, so source it here instead.
              zsh.initContent = ''
                source "${config.sops.templates."otlp-metrics-headers".path}"
              '';
            };
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
            CLAUDE_CODE_ENHANCED_TELEMETRY_BETA = "1";
            OTEL_METRICS_EXPORTER = "otlp";
            OTEL_LOGS_EXPORTER = "otlp";
            OTEL_TRACES_EXPORTER = "otlp";
            OTEL_EXPORTER_OTLP_PROTOCOL = "grpc";
            OTEL_EXPORTER_OTLP_ENDPOINT = "https://otlp.mackerelio.com:4317";
            OTEL_EXPORTER_OTLP_LOGS_PROTOCOL = "http/protobuf";
            OTEL_EXPORTER_OTLP_LOGS_ENDPOINT = "https://otlp-vaxila.mackerelio.com/v1/logs";
            OTEL_EXPORTER_OTLP_TRACES_PROTOCOL = "http/protobuf";
            OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = "https://otlp-vaxila.mackerelio.com/v1/traces";
            OTEL_LOG_USER_PROMPTS = "1";
            OTEL_LOG_TOOL_DETAILS = "1";
            OTEL_LOG_TOOL_CONTENT = "1";
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
