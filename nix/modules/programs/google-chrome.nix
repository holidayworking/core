{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.google-chrome";

  options = delib.singleEnableOption host.isDesktop;

  home.ifEnabled.programs.chromium = {
    enable = true;
    package = if host.isDarwin then pkgs.google-chrome else pkgs.chromium;
  };
}
