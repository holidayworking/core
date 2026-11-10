{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.appcleaner";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = [
    (pkgs.appcleaner.overrideAttrs (old: {
      # The upstream zip ships Finder's __MACOSX metadata, which would otherwise
      # be copied into /Applications/Nix Apps next to the app.
      postInstall = (old.postInstall or "") + ''
        rm -rf $out/Applications/__MACOSX
      '';
    }))
  ];
}
