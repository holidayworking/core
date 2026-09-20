{ delib, pkgs, ... }:
delib.module {
  name = "services.opentelemetry-collector";

  options = delib.singleEnableOption false;

  nixos.ifEnabled.services.opentelemetry-collector = {
    enable = true;
    package = pkgs.opentelemetry-collector-contrib;

    validateConfigFile = false;

    settings = {
      exporters.otlphttp = {
        metrics_endpoint = "https://monitoring.ap-northeast-1.amazonaws.com/v1/metrics";
        auth.authenticator = "sigv4auth";
      };

      extensions.sigv4auth = {
        region = "ap-northeast-1";
        service = "monitoring";
      };

      receivers.prometheus.config.scrape_configs = [
        {
          job_name = "openwrt";
          scrape_interval = "60s";
          static_configs = [
            { targets = [ "openwrt:9100" ]; }
          ];
        }
      ];

      processors = {
        transform = {
          error_mode = "ignore";
          metric_statements = [
            {
              context = "metric";
              statements = [
                ''convert_sum_to_gauge() where metric.name == "node_time_seconds"''
              ];
            }
          ];
        };

        cumulativetodelta = { };

        batch = {
          send_batch_size = 200;
          timeout = "10s";
        };
      };

      service = {
        extensions = [ "sigv4auth" ];

        pipelines.metrics = {
          exporters = [
            "otlphttp"
          ];
          processors = [
            "transform"
            "cumulativetodelta"
            "batch"
          ];
          receivers = [ "prometheus" ];
        };
      };
    };
  };
}
