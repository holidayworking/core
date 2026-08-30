{ delib, host, ... }:
delib.module {
  name = "programs.safari";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.targets.darwin = {
    defaults."com.apple.Safari" = {
      AutoFillPasswords = false;
      AutoOpenSafeDownloads = false;
      IncludeDevelopMenu = true;
    };
  };
}
