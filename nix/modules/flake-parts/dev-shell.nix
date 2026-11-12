{ inputs, ... }:
{
  flake-file.inputs.nix-vite-plus = {
    url = "github:ryoppippi/nix-vite-plus";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  perSystem =
    {
      lib,
      pkgs,
      system,
      ...
    }:
    {
      _module.args.pkgs = import inputs.nixpkgs {
        inherit system;

        overlays = [
          inputs.nix-vite-plus.overlays.default
          (_final: prev: {
            # TODO: remove once test_toml_invalid_file_name passes upstream
            aws-sam-cli = prev.aws-sam-cli.overridePythonAttrs (old: {
              disabledTests = old.disabledTests ++ [ "test_toml_invalid_file_name" ];
            });
          })
        ];
      };

      devShells.default = pkgs.mkShell {
        packages = with pkgs; [
          act
          age
          aws-sam-cli
          clang
          hugo
          sops
          vite-plus
        ];

        shellHook =
          let
            vp = lib.getExe pkgs.vite-plus;
            mcpConfig = inputs.mcp-servers-nix.lib.mkConfig pkgs {
              settings.servers.textlint = {
                args = [
                  "exec"
                  "textlint"
                  "--mcp"
                ];

                command = vp;
              };
            };
          in
          ''
            # aws-sam-cli leaks python3.14 site-packages via PYTHONPATH,
            # which breaks uvx-based MCP servers on other Python versions.
            # sam itself is a wrapped binary and does not need it.
            unset PYTHONPATH

            if [ ! -f "$HOME/.config/vite-plus/env" ]; then
              ${vp} env setup
            fi
            source "$HOME/.config/vite-plus/env"
            ${vp} install

            ln -sfn ${mcpConfig} .mcp.json
          '';
      };
    };
}
