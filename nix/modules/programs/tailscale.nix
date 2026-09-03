{ delib, ... }:
delib.module {
  name = "programs.tailscale";

  darwin.always.homebrew.casks = [
    "tailscale-app"
  ];
}
