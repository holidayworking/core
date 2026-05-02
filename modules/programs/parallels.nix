{ delib, host, ... }:
delib.module {
  name = "programs.parallels";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew.casks = [
    "parallels"
  ];
}
