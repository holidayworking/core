{ delib, inputs, ... }:
delib.module {
  name = "homebrew";

  darwin.always =
    { myconfig, ... }:
    {
      imports = [
        inputs.nix-homebrew.darwinModules.nix-homebrew
      ];

      homebrew = {
        enable = true;

        taps = [
          "socktainer/tap"
        ];

        onActivation = {
          autoUpdate = false;
          cleanup = "zap";
        };
      };

      nix-homebrew = {
        enable = true;
        user = myconfig.constants.username;
      };
    };
}
