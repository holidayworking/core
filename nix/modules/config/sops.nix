{ delib, inputs, ... }:
delib.module {
  name = "sops";

  darwin.always =
    { myconfig, ... }:
    {
      imports = [ inputs.sops-nix.darwinModules.sops ];

      sops = {
        age.keyFile = "/Users/${myconfig.constants.username}/.config/sops/age/keys.txt";
        defaultSopsFile = ../../secrets/secrets.yaml;
      };
    };

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
