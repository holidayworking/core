{ inputs, ... }:
{
  flake-file.inputs.mcp-servers-nix = {
    url = "github:natsukium/mcp-servers-nix";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  den.aspects.ai.homeManager = { lib, pkgs, ... }: {
    imports = [
      inputs.mcp-servers-nix.homeManagerModules.default
    ];

    mcp-servers = {
      programs = {
        context7.enable = true;
        nixos.enable = true;
      };

      settings.servers.cloudwatch = {
        args = [
          "--python"
          "3.13"
          "awslabs.cloudwatch-mcp-server@latest"
        ];

        command = lib.getExe' pkgs.uv "uvx";

        env = {
          AWS_PROFILE = "main";
          AWS_REGION = "ap-northeast-1";
          FASTMCP_LOG_LEVEL = "ERROR";
          # Override PYTHONPATH inherited from devShells (e.g. aws-sam-cli),
          # which otherwise shadows uvx's packages with incompatible ones.
          PYTHONPATH = "";
        };
      };
    };

    programs.mcp.enable = true;
  };
}
