{
  delib,
  config,
  inputs,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "services.xremap";

  options = delib.singleEnableOption (pkgs.stdenv.isLinux && host.isDesktop);

  nixos = {
    always.imports = [ inputs.xremap-flake.nixosModules.default ];

    ifEnabled = {
      services.xremap = {
        enable = true;
        serviceMode = "user";
        userName = config.myconfig.constants.username;
        withGnome = true;

        config = {
          modmap = [
            {
              name = "Global";
              remap.CapsLock = "Ctrl_L";
            }
          ];

          keymap = [
            {
              name = "Global";
              application.not = [
                "Code"
                "com.mitchellh.ghostty"
                "foot"
              ];
              remap = {
                "Ctrl-a" = "Home";
                "Ctrl-e" = "End";
                "Super-a" = "Ctrl-a";
                "Super-c" = "Ctrl-c";
                "Super-f" = "Ctrl-f";
                "Super-n" = "Ctrl-n";
                "Super-p" = "Ctrl-p";
                "Super-s" = "Ctrl-s";
                "Super-v" = "Ctrl-v";
                "Super-x" = "Ctrl-x";
                "Super-z" = "Ctrl-z";
              };
            }
            {
              name = "Ghostty";
              application.only = [
                "com.mitchellh.ghostty"
                "foot"
              ];
              remap = {
                "Super-a" = "Ctrl-Shift-a";
                "Super-c" = "Ctrl-Shift-c";
                "Super-f" = "Ctrl-Shift-f";
                "Super-v" = "Ctrl-Shift-v";
                "Super-x" = "Ctrl-Shift-x";
                "Super-z" = "Ctrl-Shift-z";
              };
            }
          ];
        };
      };
    };
  };
}
