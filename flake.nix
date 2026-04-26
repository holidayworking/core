{
  inputs = {
    systems.url = "github:nix-systems/default";

    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    nix-vite-plus = {
      url = "github:ryoppippi/nix-vite-plus";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    cspell-nix = {
      url = "github:kakkun61/cspell-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    treefmt-nix = {
      url = "github:numtide/treefmt-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs =
    inputs@{ flake-parts, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } (
      { inputs, ... }:
      {
        imports = [
          inputs.cspell-nix.flakeModule
          inputs.treefmt-nix.flakeModule
        ];

        systems = import inputs.systems;

        perSystem =
          {
            lib,
            pkgs,
            system,
            ...
          }:
          let
            markdownlintConfig = pkgs.writeText "generated.markdownlint-cli2.jsonc" (
              builtins.toJSON {
                config = {
                  commands-show-output = false;
                  line-length = false;
                  no-inline-html = false;
                  no-bare-urls = false;
                };
              }
            );

            textlintConfig = pkgs.writeText "generated.textlintrc.json" (
              builtins.toJSON {
                filters = {
                  comments = true;
                };
                plugins = { };
                rules = {
                  preset-ja-spacing = {
                    ja-space-between-half-and-full-width = {
                      space = "always";
                    };
                  };
                  preset-ja-technical-writing = {
                    sentence-length = false;
                  };
                  prh = {
                    rulePaths = [
                      "${pkgs.textlint-rule-prh}/lib/node_modules/textlint-rule-prh/node_modules/prh/prh-rules/media/techbooster.yml"
                    ];
                  };
                };
              }
            );
          in
          {
            _module.args.pkgs = import inputs.nixpkgs {
              inherit system;
              overlays = [
                inputs.nix-vite-plus.overlays.default
                (_final: prev: {
                  textlint-filter-rule-comments = prev.stdenvNoCC.mkDerivation {
                    pname = "textlint-filter-rule-comments";
                    version = "1.3.0";

                    src = prev.fetchurl {
                      url = "https://registry.npmjs.org/textlint-filter-rule-comments/-/textlint-filter-rule-comments-1.3.0.tgz";
                      hash = "sha256-+nMBkOEC8A2X5jw7Thg5rlI/9wC7ywaQjZhN8QkfiRA=";
                    };

                    dontBuild = true;

                    installPhase = ''
                      runHook preInstall

                      mkdir -p "$out/lib/node_modules/textlint-filter-rule-comments"
                      tar -xzf "$src" --strip-components=1 -C "$out/lib/node_modules/textlint-filter-rule-comments"

                      runHook postInstall
                    '';
                  };
                  # Upstream installCheckPhase runs `vp --version`, which can fail on some
                  # platforms; disable it everywhere for consistent builds.
                  vite-plus = prev.vite-plus.overrideAttrs { doInstallCheck = false; };
                })
              ];
              config = { };
            };

            devShells.default = pkgs.mkShell {
              packages = with pkgs; [
                act
                vite-plus
              ];

              shellHook = ''
                ln -sfn ${textlintConfig} .textlintrc.json
                ln -sfn ${markdownlintConfig} .markdownlint-cli2.jsonc
              '';
            };

            cspell.configFile = ./cspell.json;

            treefmt = {
              projectRootFile = "flake.nix";

              programs = {
                actionlint.enable = true;
                deadnix.enable = true;
                nixfmt.enable = true;
                # pinact.enable = true;
                shellcheck.enable = true;
                shfmt.enable = true;
              };

              settings.formatter = {
                ghalint = {
                  command = "${pkgs.bash}/bin/bash";
                  options = [
                    "-euc"
                    "${pkgs.lib.getExe pkgs.ghalint} run $@"
                    "--"
                  ];
                  includes = [
                    ".github/workflows/*.yml"
                    ".github/workflows/*.yaml"
                  ];
                };

                markdownlint = {
                  command = "${pkgs.bash}/bin/bash";
                  options = [
                    "-euc"
                    "${pkgs.lib.getExe pkgs.markdownlint-cli2} --config ${markdownlintConfig} $@"
                    "--"
                  ];
                  includes = [ "*.md" ];
                };

                textlint = {
                  command = "${pkgs.bash}/bin/bash";
                  options = [
                    "-euc"
                    "${
                      with pkgs;
                      lib.getExe' (textlint.withPackages [
                        textlint-filter-rule-comments
                        textlint-rule-preset-ja-spacing
                        textlint-rule-preset-ja-technical-writing
                        textlint-rule-prh
                      ]) "textlint"
                    } --config ${textlintConfig} $@"
                    "--"
                  ];
                  includes = [ "*.md" ];
                };
              };
            };
          };
      }
    );
}
