{ delib, host, ... }:
delib.module {
  name = "programs.tailscale";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew.casks = [
    "tailscale"
  ];
}
