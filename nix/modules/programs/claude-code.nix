{ delib, pkgs, ... }:
delib.module {
  name = "programs.claude-code";

  home.always.imports = [
    (
      { config, ... }:
      {
        programs.claude-code = {
          enable = true;
          package = pkgs.llm-agents.claude-code;

          enableMcpIntegration = true;

          settings = {
            enableAllProjectMcpServers = true;
            language = "japanese";
            theme = "auto";

            enabledPlugins = {
              "claude-code-setup@claude-plugins-official" = true;
              "claude-md-management@claude-plugins-official" = true;
              "claude-notifications-go@claude-notifications-go" = true;
              "code-simplifier@claude-plugins-official" = true;
              "codex@openai-codex" = true;
              "commit-commands@claude-plugins-official" = true;
            };

            env = {
              "CLAUDE_CODE_ENABLE_TELEMETRY" = "1";
              "OTEL_METRICS_EXPORTER" = "otlp";
              "OTEL_LOGS_EXPORTER" = "otlp";
              "OTEL_EXPORTER_OTLP_PROTOCOL" = "http/protobuf";
              "OTEL_EXPORTER_OTLP_ENDPOINT" = "https://otlp-gateway-prod-ap-northeast-0.grafana.net/otlp";
              "OTEL_LOG_USER_PROMPTS" = "1";
              "OTEL_LOG_TOOL_DETAILS" = "1";
              "OTEL_EXPORTER_OTLP_METRICS_TEMPORALITY_PREFERENCE" = "cumulative";
            };

            # The OTLP auth token is a secret, so it must not be baked into the
            # world-readable settings.json in the Nix store. Claude Code's
            # otelHeadersHelper delegates header generation to an external script,
            # which here reads the token from the sops-decrypted file at runtime
            # (and re-runs periodically).
            otelHeadersHelper = "${pkgs.writeShellScript "claude-otel-headers" ''
              set -euo pipefail
              token="$(cat ${config.sops.secrets.grafana-cloud-claude-code-token.path} 2>/dev/null || true)"
              if [ -z "$token" ]; then
                printf '%s\n' '{"error":"grafana-cloud-claude-code-token unavailable"}' >&2
                exit 1
              fi
              printf '{"Authorization":"Basic %s"}\n' "$token"
            ''}";

            extraKnownMarketplaces = {
              "claude-notifications-go" = {
                source = {
                  source = "github";
                  repo = "777genius/claude-notifications-go";
                };
              };
              "openai-codex" = {
                source = {
                  source = "github";
                  repo = "openai/codex-plugin-cc";
                };
              };
            };

            permissions = {
              defaultMode = "plan";
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
    )
  ];
}
