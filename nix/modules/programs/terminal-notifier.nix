{
  delib,
  pkgs,
  pkgs-master,
  ...
}:
delib.module {
  name = "programs.terminal-notifier";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled.home.packages = [
    pkgs-master.terminal-notifier
  ];
}
