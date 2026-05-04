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

    llm-agents = {
      url = "github:numtide/llm-agents.nix";
      inputs.nixpkgs.follows = "nixpkgs";
    };

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
            pkgs,
            ...
          }:
          {
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
              };
            };
          };
      }
    );
}
