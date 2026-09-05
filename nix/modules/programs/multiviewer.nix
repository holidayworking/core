{ delib, ... }:
delib.module {
  name = "programs.multiviewer";

  darwin.always.homebrew.casks = [
    "multiviewer"
  ];
}
