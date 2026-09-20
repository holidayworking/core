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

    mcp-servers = {
      programs = {
        context7.enable = true;
        nixos.enable = true;
      };

      settings.servers = {
        cloudwatch = {
          command = "uvx";
          args = [ "awslabs.cloudwatch-mcp-server@latest" ];
          env = {
            AWS_PROFILE = "main";
            AWS_REGION = "ap-northeast-1";
            FASTMCP_LOG_LEVEL = "ERROR";
          };
        };

        codegraph = {
          command = lib.getExe pkgs.llm-agents.codegraph;
          args = [
            "serve"
            "--mcp"
          ];
        };
      };
    };
  };
}
