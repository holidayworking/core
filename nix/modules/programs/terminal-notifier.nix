{ delib, pkgs, ... }:
delib.module {
  name = "programs.terminal-notifier";

  options = delib.singleEnableOption pkgs.stdenv.hostPlatform.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    terminal-notifier
  ];
}
