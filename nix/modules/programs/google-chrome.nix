{ delib, ... }:
delib.module {
  name = "programs.google-chrome";

  home.always.programs.google-chrome.enable = true;
}
