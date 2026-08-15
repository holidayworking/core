{ delib, pkgs, ... }:
delib.module {
  name = "programs.toggl-track";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  darwin.ifEnabled.homebrew.masApps."Toggl Track" = 1291898086;
}
