{
  den.aspects.ai.homeManager =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      # The hook script `herdr integration install claude` would write; it can't
      # edit the Nix-managed settings.json, so generate it here and declare the hook.
      # The script silently does nothing without python3 on PATH, so pin it.
      herdrClaudeIntegration = pkgs.runCommand "herdr-claude-integration" { } ''
        mkdir -p $out
        echo '{}' > $out/settings.json
        HOME=$TMPDIR CLAUDE_CONFIG_DIR=$out ${lib.getExe config.programs.herdr.package} integration install claude
        substituteInPlace $out/hooks/herdr-agent-state.sh \
          --replace-fail "command -v python3" "command -v ${lib.getExe pkgs.python3}" \
          --replace-fail "python3 - <<" "${lib.getExe pkgs.python3} - <<"
      '';
    in
    {
      programs = {
        claude-code = {
          enable = true;
          package = pkgs.llm-agents.claude-code;
          enableMcpIntegration = true;
          hooks."herdr-agent-state.sh" = "${herdrClaudeIntegration}/hooks/herdr-agent-state.sh";

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

            # Same entry as `herdr integration install claude`.
            hooks.SessionStart = [
              {
                hooks = [
                  {
                    command = "bash ~/.claude/hooks/herdr-agent-state.sh session";
                    timeout = 10;
                    type = "command";
                  }
                ];

                matcher = "^(startup|resume|clear|compact|fork)$";
              }
            ];

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
