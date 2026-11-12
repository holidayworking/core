{ inputs, ... }:
{
  flake-file.inputs.sops-nix = {
    url = "github:Mic92/sops-nix";
    inputs.nixpkgs.follows = "nixpkgs";
  };

  den.aspects.base.homeManager = { config, ... }: {
    imports = [ inputs.sops-nix.homeManagerModules.sops ];

    sops = {
      age.keyFile = "${config.xdg.configHome}/sops/age/keys.txt";
      defaultSopsFile = ../../../secrets/secrets.yaml;

      secrets.cloudwatch-api-key = { };

      templates.otlp-headers-helper = {
        content = ''
          #!/usr/bin/env bash

          set -euCo pipefail

          echo "{\"Authorization\": \"Bearer ${config.sops.placeholder.cloudwatch-api-key}\"}"
        '';

        mode = "0500";
      };
    };
  };
}
