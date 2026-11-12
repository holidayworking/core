{ inputs, ... }:
{
  den.aspects.desktop.darwin = {
    # Claude Desktop only exists on macOS, so hand its Home Manager module to the
    # users of darwin hosts instead of using a homeManager key.
    home-manager.sharedModules = [
      (
        {
          lib,
          pkgs,
          config,
          ...
        }:
        let
          configPath = "${config.home.homeDirectory}/Library/Application Support/Claude/claude_desktop_config.json";

          staticConfig = inputs.mcp-servers-nix.lib.mkConfig pkgs {
            inherit (config.mcp-servers) programs settings;
          };
        in
        {
          imports = [ inputs.mcp-servers-nix.homeManagerModules.default ];

          # Claude Desktop rewrites claude_desktop_config.json on launch, so a
          # plain home.file symlink cannot survive. Merge the Nix-managed settings
          # into the existing file on activation instead, letting Nix own the
          # mcpServers key while preserving anything else Claude Desktop wrote.
          home.activation.claudeDesktopConfig = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
            (
              claudeConfig=${lib.escapeShellArg configPath}
              run mkdir -p "$(dirname "$claudeConfig")"
              merged="$(${lib.getExe pkgs.jq} -s '.[0] + .[1]' "$claudeConfig" ${staticConfig} 2>/dev/null || cat ${staticConfig})"
              if [ "$merged" != "$(cat "$claudeConfig" 2>/dev/null)" ]; then
                printf '%s\n' "$merged" | run tee "$claudeConfig" >/dev/null
              fi
            )
          '';

          mcp-servers.settings.servers = { };
        }
      )
    ];

    # Claude Desktop only honors disableAutoUpdates from managed preferences.
    managedPreferences."com.anthropic.claudefordesktop".disableAutoUpdates = true;
  };
}
