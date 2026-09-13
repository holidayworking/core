{
  delib,
  host,
  inputs,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.mcp";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled = {
    imports = [
      inputs.mcp-servers-nix.homeManagerModules.default
    ];

    programs.mcp.enable = true;

    mcp-servers.programs = {
      context7.enable = true;
      nixos.enable = true;
    };

    mcp-servers.settings.servers.codegraph = {
      command = lib.getExe pkgs.llm-agents.codegraph;
      args = [
        "serve"
        "--mcp"
      ];
    };
  };
}
