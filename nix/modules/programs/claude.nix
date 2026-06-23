{
  delib,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.claude";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "claude"
  ];

  home.ifEnabled.imports = [
    (
      { config, ... }:
      {
        home.file."Library/Application Support/Claude/claude_desktop_config.json" = {
          source = inputs.mcp-servers-nix.lib.mkConfig pkgs {
            inherit (config.mcp-servers) programs settings;
          };
          # Claude Desktop rewrites this file on launch, replacing the
          # home-manager symlink with a regular file. Without force, the next
          # activation aborts because an unmanaged file is in the way.
          force = true;
        };
      }
    )
  ];
}
