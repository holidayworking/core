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

            templates = {
              # otelHeadersHelper (see programs/claude-code.nix) only applies to
              # the http/protobuf and http/json OTLP protocols. The grpc
              # exporter used for metrics (Mackerel only accepts OTLP metrics
              # over grpc) only reads the static OTEL_EXPORTER_OTLP_HEADERS env
              # var, so this template is sourced from a shell instead.
              "otlp-metrics-headers" = {
                mode = "0400";
                content = ''
                  export OTEL_EXPORTER_OTLP_HEADERS="Mackerel-Api-Key=${config.sops.placeholder.mackerel-api-key}"
                '';
              };

              "otlp-headers-helper" = {
                mode = "0500";
                content = ''
                  #!/usr/bin/env bash

                  set -euCo pipefail

                  echo "{\"Mackerel-Api-Key\": \"${config.sops.placeholder.mackerel-api-key}\"}"
                '';
              };
            };
          };
        }
      )
    ];
  };
}
