{
  delib,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "mcp-servers";

  myconfig.always.args.shared.mcpServers = {
    programs = {
      codex.enable = true;
      context7.enable = true;
      nixos.enable = true;
      terraform.enable = true;

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
  };
}
