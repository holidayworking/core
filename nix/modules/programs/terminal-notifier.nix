{ delib, pkgs, ... }:
delib.module {
  name = "programs.terminal-notifier";

  home.always.home.packages = [ pkgs.terminal-notifier ];
}
