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

            secrets.mackerel-api-key = { };

            templates."otlp-headers-helper" = {
              mode = "0500";
              content = ''
                #!/usr/bin/env bash

                set -euCo pipefail

                echo "{\"Mackerel-Api-Key\": \"${config.sops.placeholder.mackerel-api-key}\"}"
              '';
            };
          };
        }
      )
    ];
  };
}
