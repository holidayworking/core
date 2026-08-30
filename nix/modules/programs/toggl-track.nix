{ delib, host, ... }:
delib.module {
  name = "programs.toggl-track";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.homebrew.masApps."Toggl Track" = 1291898086;
}
