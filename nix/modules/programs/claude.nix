{
  delib,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.claude";

  darwin.always.homebrew.casks = [
    "claude"
  ];

  home.always.imports = [
    (
      { config, lib, ... }:
      let
        configPath = "${config.home.homeDirectory}/Library/Application Support/Claude/claude_desktop_config.json";

        staticConfig = inputs.mcp-servers-nix.lib.mkConfig pkgs {
          inherit (config.mcp-servers) programs settings;
        };
      in
      {
        # Claude Desktop rewrites claude_desktop_config.json on launch, so a
        # plain home.file symlink cannot survive. Merge the Nix-managed settings
        # into the existing file on activation instead, letting Nix own the
        # mcpServers key while preserving anything else Claude Desktop wrote.
        home.activation.claudeDesktopConfig = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
          (
            claudeConfig=${lib.escapeShellArg configPath}
            $DRY_RUN_CMD mkdir -p "$(dirname "$claudeConfig")"
            merged="$(${lib.getExe pkgs.jq} -s '.[0] + .[1]' "$claudeConfig" ${staticConfig} 2>/dev/null || cat ${staticConfig})"
            if [ "$merged" != "$(cat "$claudeConfig" 2>/dev/null)" ]; then
              printf '%s\n' "$merged" | $DRY_RUN_CMD tee "$claudeConfig" >/dev/null
            fi
          )
        '';
      }
    )
  ];
}
