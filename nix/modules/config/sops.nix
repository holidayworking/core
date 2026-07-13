{ delib, inputs, ... }:
delib.module {
  name = "sops";

  home.always.imports = [
    inputs.sops-nix.homeManagerModules.sops
    (
      { config, ... }:
      {
        sops = {
          age.keyFile = "${config.xdg.configHome}/sops/age/keys.txt";
          defaultSopsFile = ../../secrets/secrets.yaml;

          secrets.grafana-cloud-claude-code-token = { };
        };
      }
    )
  ];
}
