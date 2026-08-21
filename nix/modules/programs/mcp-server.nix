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

  options = delib.singleEnableOption host.aiFeatured;

  home.ifEnabled = {
    imports = [ inputs.mcp-servers-nix.homeManagerModules.default ];

    programs.mcp.enable = true;

    mcp-servers.programs = {
      context7.enable = true;
      nixos.enable = true;

      github = {
        enable = true;

        passwordCommand = {
          GITHUB_PERSONAL_ACCESS_TOKEN = [
            (lib.getExe pkgs.gh)
            "auth"
            "token"
          ];
        };
      };
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
