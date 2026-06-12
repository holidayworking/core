{ delib, host, ... }:
delib.module {
  name = "programs.socktainer";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew = {
    brews = [
      {
        name = "socktainer-next";
        start_service = true;
      }
    ];
  };
}
