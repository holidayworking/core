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

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
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

    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    vercel-labs-skills = {
      url = "github:vercel-labs/agent-skills";
      flake = false;
    };

    cosmic-manager = {
      url = "github:HeitorAugustoLN/cosmic-manager";
      inputs = {
        nixpkgs.follows = "nixpkgs";
        home-manager.follows = "home-manager";
      };
    };

    llm-agents-nix.url = "github:numtide/llm-agents.nix";

    mcp-servers-nix = {
      url = "github:natsukium/mcp-servers-nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix-vite-plus = {
      url = "github:ryoppippi/nix-vite-plus";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nix-vscode-extensions = {
      url = "github:nix-community/nix-vscode-extensions";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    nixos-lima = {
      url = "github:nixos-lima/nixos-lima/master";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    sops-nix = {
      url = "github:Mic92/sops-nix";
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
                  ./nix/hosts
                  ./nix/modules
                  ./nix/overlays
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
            system,
            pkgs,
            ...
          }:
          {
            _module.args.pkgs = import inputs.nixpkgs {
              inherit system;
              overlays = [
                inputs.nix-vite-plus.overlays.default
                (_final: prev: {
                  aws-iac-mcp-server = prev.callPackage ./nix/packages/aws-iac-mcp-server { };

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
                  mcpConfig = inputs.mcp-servers-nix.lib.mkConfig pkgs {
                    programs = {
                      nixos.enable = true;
                    };

                    settings.servers = {
                      "awslabs.aws-iac-mcp-server" = {
                        command = pkgs.lib.getExe pkgs.aws-iac-mcp-server;
                        env = {
                          AWS_PROFILE = "master";
                          FASTMCP_LOG_LEVEL = "ERROR";
                        };
                      };

                      textlint = {
                        command = pkgs.lib.getExe pkgs.vite-plus;
                        args = [
                          "exec"
                          "textlint"
                          "--mcp"
                        ];
                      };
                    };
                  };
                in
                ''
                  ${pkgs.lib.getExe pkgs.proto} install
                  ${pkgs.lib.getExe pkgs.vite-plus} install

                  if [ -L ".mcp.json" ]; then
                    unlink .mcp.json
                  fi
                  ln -sf ${mcpConfig} .mcp.json
                '';
            };

            packages = {
              build-hugo = pkgs.stdenv.mkDerivation {
                name = "build-hugo";
                src = ./apps/hugo;
                nativeBuildInputs = with pkgs; [
                  hugo
                ];
                buildPhase = ''
                  hugo --minify
                '';
                installPhase = ''
                  cp -r ./public $out
                '';
              };
            }
            // pkgs.lib.optionalAttrs (system == "aarch64-linux") {
              lima =
                (inputs.nixpkgs.lib.nixosSystem {
                  modules = [
                    { nixpkgs.pkgs = pkgs; }
                    inputs.nixos-lima.nixosModules.lima
                    (
                      { modulesPath, pkgs, ... }:
                      {
                        imports = [
                          (modulesPath + "/profiles/qemu-guest.nix")
                        ];

                        boot.kernelPackages = pkgs.linuxPackages_latest;
                        system.stateVersion = "25.05";

                        environment.systemPackages = with pkgs; [
                          gitMinimal
                        ];

                        image.modules.qemu-efi =
                          {
                            config,
                            lib,
                            pkgs,
                            modulesPath,
                            ...
                          }:
                          {
                            image.baseName = "nixos-lima";

                            system.build.image = lib.mkForce (
                              import (modulesPath + "/../lib/make-disk-image.nix") {
                                inherit lib config pkgs;
                                inherit (config.virtualisation) diskSize;
                                inherit (config.image) baseName format;

                                bootSize = "1G";
                                partitionTableType = "efi";
                              }
                            );
                          };

                        nix.settings.experimental-features = [
                          "nix-command"
                          "flakes"
                        ];

                        security.sudo-rs = {
                          enable = true;
                          wheelNeedsPassword = false;
                        };

                        services = {
                          lima.enable = true;
                          openssh.enable = true;
                        };
                      }
                    )
                  ];
                }).config.system.build.images.qemu-efi;
            };

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
              };
            };
          };
      }
    );
}
