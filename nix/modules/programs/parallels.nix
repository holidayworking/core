{ delib, ... }:
delib.module {
  name = "programs.parallels";

  darwin.always.homebrew.casks = [
    "parallels"
  ];
}
