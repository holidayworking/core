{ den, inputs, ... }:
let
  nixpkgs = {
    config.allowUnfree = true;

    overlays = [
      inputs.llm-agents-nix.overlays.shared-nixpkgs
      inputs.nix-vscode-extensions.overlays.default
      (_final: prev: {
        local =
          let
            # Sources tracked by nvfetcher (nix/sources/nvfetcher.toml).
            sources = prev.callPackage ../sources/generated/generated.nix { };
          in
          prev.lib.mapAttrs (
            name: _:
            prev.callPackage (../packages + "/${name}") {
              inherit inputs sources;
            }
          ) (prev.lib.filterAttrs (_: type: type == "directory") (builtins.readDir ../packages));
      })
    ];
  };
in
{
  flake-file.inputs = {
    llm-agents-nix.url = "github:numtide/llm-agents.nix";

    nix-vscode-extensions = {
      url = "github:nix-community/nix-vscode-extensions";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  den.default = {
    includes = [
      den.aspects.base
      den.aspects.vpn
      den.batteries.define-user
      den.batteries.hostname
      den.batteries.inputs'
    ];

    os = { inherit nixpkgs; };

    nixos.system.stateVersion = "25.05";

    darwin.system.stateVersion = 5;

    homeManager = {
      home.stateVersion = "25.05";

      inherit nixpkgs;
    };
  };

  den.schema.user.classes = [ "homeManager" ];
}
