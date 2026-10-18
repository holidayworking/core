{
  delib,
  host,
  inputs,
  ...
}:
delib.module {
  name = "services.xremap";

  options = delib.singleEnableOption host.isPC;

  nixos.always =
    { cfg, ... }:
    {
      imports = [ inputs.xremap-flake.nixosModules.default ];

      services.xremap.enable = cfg.enable;
    };

  nixos.ifEnabled =
    { myconfig, ... }:
    {
      services.xremap = {
        serviceMode = "user";
        userName = myconfig.constants.username;
        withGnome = true;

        config = {
          keymap = [
            {
              name = "Global";
              application.not = [
                "code"
                "com.mitchellh.ghostty"
              ];
              remap = {
                "C-Super-f" = "C-Super-f";
                "C-a" = "home";
                "C-e" = "end";
                "Super-0" = "C-0";
                "Super-a" = "C-a";
                "Super-b" = "C-b";
                "Super-c" = "C-c";
                "Super-comma" = "C-comma";
                "Super-equal" = "C-equal";
                "Super-f" = "C-f";
                "Super-g" = "C-g";
                "Super-i" = "C-i";
                "Super-k" = "C-k";
                "Super-l" = "C-l";
                "Super-minus" = "C-minus";
                "Super-n" = "C-n";
                "Super-o" = "C-o";
                "Super-p" = "C-p";
                "Super-r" = "C-r";
                "Super-s" = "C-s";
                "Super-t" = "C-t";
                "Super-u" = "C-u";
                "Super-v" = "C-v";
                "Super-w" = "C-w";
                "Super-x" = "C-x";
                "Super-z" = "C-z";
              };
            }
            {
              name = "Esc with IME off";
              remap.Esc = [
                "Esc"
                "Muhenkan"
              ];
            }
          ];

          modmap = [
            {
              name = "Global";
              remap.CapsLock = "Ctrl_L";
            }
          ];
        };
      };
    };
}
