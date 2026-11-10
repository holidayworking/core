{
  delib,
  host,
  inputs,
  lib,
  pkgs,
  ...
}:
let
  # Claude Desktop only honors disableAutoUpdates from managed preferences (a
  # plain `defaults write` is ignored), and macOS no longer lets a
  # configuration profile be installed without approving it in System
  # Settings, so Nix only builds the profile and points at it until installed.
  profileIdentifier = "com.github.holidayworking.core.claude";
  profileEtcPath = "claude/disable-auto-updates.mobileconfig";
  prefDomain = "com.anthropic.claudefordesktop";
  profile = lib.generators.toPlist { escape = true; } {
    PayloadDisplayName = "Claude Desktop";
    PayloadIdentifier = profileIdentifier;
    PayloadScope = "System";
    PayloadType = "Configuration";
    PayloadUUID = "61B7D224-6606-41DD-BBCF-89C3FC81F43E";
    PayloadVersion = 1;
    PayloadContent = [
      {
        PayloadDisplayName = "Disable auto-updates";
        PayloadIdentifier = "${profileIdentifier}.settings";
        PayloadType = prefDomain;
        PayloadUUID = "E13329F2-3D4A-4599-8C3E-5B0C09476515";
        PayloadVersion = 1;
        disableAutoUpdates = true;
      }
    ];
  };
in
delib.module {
  name = "programs.claude";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled = {
    environment = {
      systemPackages = [ pkgs.local.claude ];
      etc.${profileEtcPath}.text = profile;
    };

    system.activationScripts.postActivation.text = ''
      if [ "$(/usr/bin/defaults read "/Library/Managed Preferences/${prefDomain}" disableAutoUpdates 2>/dev/null)" != 1 ]; then
        echo "Claude Desktop auto-updates are still on: run 'open /etc/${profileEtcPath}', then install it in System Settings > General > Device Management." >&2
      fi
    '';
  };

  home.ifEnabled.imports = [
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
