{ delib, pkgs, ... }:
delib.module {
  name = "programs.safari";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.targets.darwin = {
    defaults."com.apple.Safari" = {
      AutoFillPasswords = false;
      AutoOpenSafeDownloads = false;
      IncludeDevelopMenu = true;
    };
  };
}
