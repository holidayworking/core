{ delib, host, ... }:
delib.module {
  name = "services.pipewire";

  options = delib.singleEnableOption host.isDesktop;

  nixos.ifEnabled = {
    security.rtkit.enable = true;

    services = {
      pulseaudio.enable = false;

      pipewire = {
        enable = true;
        pulse.enable = true;

        alsa = {
          enable = true;
          support32Bit = true;
        };
      };
    };
  };
}
