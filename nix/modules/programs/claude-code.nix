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

        context = ''
          <!-- CODEGRAPH_START -->
          ## CodeGraph

          In repositories indexed by CodeGraph (a `.codegraph/` directory exists at the repo root), reach for it BEFORE grep/find or reading files when you need to understand or locate code:

          - **MCP tool** (when available): `codegraph_explore` answers most code questions in one call — the relevant symbols' verbatim source plus the call paths between them, including dynamic-dispatch hops grep can't follow. Name a file or symbol in the query to read its current line-numbered source. If it's listed but deferred, load it by name via tool search.
          - **Shell** (always works): `codegraph explore "<symbol names or question>"` prints the same output.

          If there is no `.codegraph/` directory, skip CodeGraph entirely — indexing is the user's decision.
          <!-- CODEGRAPH_END -->
        '';

        settings = {
          enableAllProjectMcpServers = true;
          language = "japanese";
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

          permissions = {
            defaultMode = "plan";
            allow = [
              "mcp__codegraph__*"
            ];
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
