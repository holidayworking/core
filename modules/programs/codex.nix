{
  delib,
  mcpServers,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.codex";

  home.always.programs.codex = {
    enable = true;

    settings.mcp_servers =
      (inputs.mcp-servers-nix.lib.evalModule pkgs (
        mcpServers
        // {
          format = "toml-inline";
          flavor = "codex";
        }
      )).config.settings.servers;
  };
}
