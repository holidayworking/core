{ delib, host, ... }:
delib.module {
  name = "programs.windows-app";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew.casks = [
    "windows-app"
  ];
}
