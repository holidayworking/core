{ delib, pkgs, ... }:
delib.module {
  name = "programs.parallels";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "parallels"
  ];
}
