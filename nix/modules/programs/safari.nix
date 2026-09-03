{ delib, ... }:
delib.module {
  name = "programs.safari";

  home.always.targets.darwin = {
    defaults."com.apple.Safari" = {
      AutoFillPasswords = false;
      AutoOpenSafeDownloads = false;
      IncludeDevelopMenu = true;
    };
  };
}
