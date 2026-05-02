{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixpkgs-unstable";

    nix-darwin = {
      url = "github:nix-darwin/nix-darwin/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    home-manager = {
      url = "github:nix-community/home-manager/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    denix = {
      url = "github:yunfachi/denix";
      inputs.nixpkgs.follows = "nixpkgs";
      inputs.home-manager.follows = "home-manager";
      inputs.nix-darwin.follows = "nix-darwin";
    };

    disko = {
      url = "github:nix-community/disko";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix-homebrew.url = "github:zhaofengli/nix-homebrew";

    brew-nix = {
      url = "github:BatteredBunny/brew-nix";
      inputs.brew-api.follows = "brew-api";
    };

    brew-api = {
      url = "github:BatteredBunny/brew-api";
      flake = false;
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
    inputs@{ flake-parts, denix, ... }:
    flake-parts.lib.mkFlake { inherit inputs; } (
      { inputs, ... }:
      {
        imports = [
          inputs.cspell-nix.flakeModule
          inputs.treefmt-nix.flakeModule
        ];

        flake =
          let
            mkConfigurations =
              moduleSystem:
              denix.lib.configurations {
                inherit moduleSystem;

                homeManagerUser = "hidekazu";

                paths = [
                  ./hosts
                  ./modules
                  ./overlays
                ];

                extensions = with denix.lib.extensions; [
                  args
                  (base.withConfig {
                    args.enable = true;
                    rices.enable = false;
                  })
                  (overlays.withConfig {
                    defaultTargets = [
                      "nixos"
                      "darwin"
                    ];
                  })
                ];

                specialArgs = {
                  inherit inputs;
                };
              };

            lib = inputs.nixpkgs.lib;
            filterBySystem =
              suffix: configs:
              lib.filterAttrs (_: cfg: lib.hasSuffix suffix (cfg.config.myconfig.host.system)) configs;
          in
          {
            nixosConfigurations = filterBySystem "-linux" (mkConfigurations "nixos");
            darwinConfigurations = filterBySystem "-darwin" (mkConfigurations "darwin");
            homeConfigurations = mkConfigurations "home";
          };

        systems = [
          "aarch64-darwin"
          "aarch64-linux"
        ];

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
