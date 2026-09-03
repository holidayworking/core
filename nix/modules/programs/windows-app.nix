{ delib, ... }:
delib.module {
  name = "programs.windows-app";

  darwin.always.homebrew.casks = [
    "windows-app"
  ];
}
