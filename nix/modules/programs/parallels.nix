{ delib, host, ... }:
delib.module {
  name = "programs.parallels";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "parallels"
  ];
}
