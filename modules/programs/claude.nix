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
        home.file."Library/Application Support/Claude/claude_desktop_config.json".source =
          inputs.mcp-servers-nix.lib.mkConfig pkgs
            {
              inherit (config.mcp-servers) programs settings;
            };
      }
    )
  ];
}
