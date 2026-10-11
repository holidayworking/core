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
          args = [
            "--python"
            "3.13"
            "awslabs.cloudwatch-mcp-server@latest"
          ];
          env = {
            AWS_PROFILE = "main";
            AWS_REGION = "ap-northeast-1";
            FASTMCP_LOG_LEVEL = "ERROR";
            # Override PYTHONPATH inherited from devShells (e.g. aws-sam-cli),
            # which otherwise shadows uvx's packages with incompatible ones.
            PYTHONPATH = "";
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
