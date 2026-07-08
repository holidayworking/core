{
  delib,
  pkgs,
  lib,
  ...
}:
delib.module {
  name = "programs.cn-daemon";

  options = delib.singleEnableOption false;

  home.ifEnabled.imports = [
    (
      { config, ... }:
      {
        launchd.agents.cn-daemon = {
          enable = true;
          config = {
            ProgramArguments = [ (lib.getExe pkgs.local.cn-daemon) ];
            EnvironmentVariables = {
              CN_HOST = "127.0.0.1";
            };
            KeepAlive = true;
            RunAtLoad = true;
            ProcessType = "Background";
            StandardOutPath = "${config.home.homeDirectory}/Library/Logs/cn-daemon.log";
            StandardErrorPath = "${config.home.homeDirectory}/Library/Logs/cn-daemon.error.log";
          };
        };
      }
    )
  ];
}
