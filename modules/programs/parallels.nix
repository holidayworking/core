{ delib, pkgs, ... }:
delib.module {
  name = "programs.parallels";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "parallels"
  ];
}
