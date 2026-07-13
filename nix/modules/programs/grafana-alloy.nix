{ delib, host, ... }:
delib.module {
  name = "programs.grafana-alloy";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.homebrew = {
    brews = [
      {
        name = "grafana/grafana/alloy";
        start_service = true;
        restart_service = "changed";
      }
    ];

    taps = [ "grafana/grafana" ];
  };
}
