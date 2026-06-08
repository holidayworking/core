{
  delib,
  inputs,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.mcp";

  home.always = {
    imports = [ inputs.mcp-servers-nix.homeManagerModules.default ];

    programs.mcp.enable = true;

    mcp-servers.programs = {
      context7.enable = true;

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
