{ delib, ... }:
delib.module {
  name = "programs.toggl-track";

  darwin.always.homebrew.masApps."Toggl Track" = 1291898086;
}
