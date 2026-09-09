{ delib, host, ... }:
delib.module {
  name = "programs.google-chrome";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.programs.google-chrome.enable = true;
}
