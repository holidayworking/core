{ delib, inputs, ... }:
delib.module {
  name = "sops";

  home.always = {
    imports = [
      inputs.sops-nix.homeManagerModules.sops
      (
        { config, ... }:
        {
          sops = {
            age.keyFile = "${config.xdg.configHome}/sops/age/keys.txt";
            defaultSopsFile = ../../secrets/secrets.yaml;

            secrets.cloudwatch-api-key = { };

            templates."otlp-headers-helper" = {
              mode = "0500";
              content = ''
                #!/usr/bin/env bash

                set -euCo pipefail

                echo "{\"Authorization\": \"Bearer ${config.sops.placeholder.cloudwatch-api-key}\"}"
              '';
            };
          };
        }
      )
    ];
  };
}
