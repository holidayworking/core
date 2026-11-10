{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.terminal-notifier";

  options = delib.singleEnableOption host.isDarwin;

  darwin.ifEnabled.environment.systemPackages = with pkgs; [ terminal-notifier ];
}
