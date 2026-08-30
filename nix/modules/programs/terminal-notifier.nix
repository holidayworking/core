{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.terminal-notifier";

  options = delib.singleEnableOption host.isDarwin;

  home.ifEnabled.home.packages = with pkgs; [
    terminal-notifier
  ];
}
