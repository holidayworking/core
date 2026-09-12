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

    flake-parts = {
      url = "github:hercules-ci/flake-parts";
      inputs.nixpkgs-lib.follows = "nixpkgs";
    };

    nix-homebrew.url = "github:zhaofengli/nix-homebrew";

    agent-skills.url = "github:Kyure-A/agent-skills-nix";
    vercel-labs-skills = {
      url = "github:vercel-labs/agent-skills";
      flake = false;
    };

    amis = {
      url = "github:NixOS/amis";
      inputs.nixpkgs.follows = "nixpkgs";
    };

    crit = {
      url = "github:tomasz-tomczyk/crit";
      inputs.nixpkgs.follows = "nixpkgs";
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
      { inputs, lib, ... }:
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
                    hosts.extraSubmodules = [ hostPlatformSubmodule ];
                    rices.enable = false;
                  })
                  (overlays.withConfig {
                    defaultTargets = [
                      "nixos"
                      "darwin"
                      "home"
                    ];
                  })
                ];

                specialArgs = {
                  inherit inputs;
                };
              };

            hostPlatformSubmodule =
              { config, ... }:
              let
                platform = lib.optionalAttrs (config.system != null) (lib.systems.elaborate config.system);
              in
              {
                options = with denix.lib; {
                  isDarwin = boolOption (platform.isDarwin or false);
                  isLinux = boolOption (platform.isLinux or false);
                };
              };

            filterByPlatform = attr: lib.filterAttrs (_: cfg: cfg.config.myconfig.host.${attr});
          in
          {
            nixosConfigurations = filterByPlatform "isLinux" (mkConfigurations "nixos");
            darwinConfigurations = filterByPlatform "isDarwin" (mkConfigurations "darwin");
            homeConfigurations = mkConfigurations "home";
          };

        systems = [
          "aarch64-linux"
          "aarch64-darwin"
        ];

        perSystem =
          {
            inputs',
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
                  vp = pkgs.lib.getExe pkgs.vite-plus;
                  mcpConfig = inputs.mcp-servers-nix.lib.mkConfig pkgs {
                    settings.servers = {
                      textlint = {
                        command = vp;
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
                  if [ ! -f "$HOME/.config/vite-plus/env" ]; then
                    ${vp} env setup
                  fi
                  source "$HOME/.config/vite-plus/env"
                  ${vp} install

                  if [ -L ".mcp.json" ]; then
                    unlink .mcp.json
                  fi
                  ln -sf ${mcpConfig} .mcp.json
                '';
            };

            packages = {
              # The EBS Direct upload hardcodes 64 concurrent connections and a
              # 12s read timeout, which drops connections on a home uplink. Patch
              # it to lower the concurrency, raise the timeouts, and skip sending
              # all-zero blocks.
              upload-ami = inputs'.amis.packages.upload-ami.overrideAttrs (old: {
                patches = (old.patches or [ ]) ++ [ ./nix/patches/upload-ami-tune-ebs-direct-upload.patch ];
              });

              build-hugo = pkgs.stdenv.mkDerivation {
                name = "build-hugo";
                src = ./apps/hugo;
                nativeBuildInputs = with pkgs; [ hugo ];
                buildPhase = ''
                  hugo --minify
                '';
                installPhase = ''
                  cp -r ./public $out
                '';
              };
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
