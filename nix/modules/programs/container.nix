{ delib, host, ... }:
delib.module {
  name = "programs.container";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew.brews = [
    "container"
  ];
}
