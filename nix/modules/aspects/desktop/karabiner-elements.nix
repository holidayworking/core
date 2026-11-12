{
  den.aspects.desktop = {
    # nix-darwin's services.karabiner-elements has been broken since v15
    # (nix-darwin/nix-darwin#1041), so run the official installer package (see
    # nix/packages/karabiner-elements) whenever the installed version differs.
    darwin =
      { pkgs, ... }:
      let
        package = pkgs.local.karabiner-elements;
      in
      {
        system.activationScripts.postActivation.text = ''
          if [ "$(pkgutil --pkg-info org.pqrs.Karabiner-Elements 2>/dev/null | sed -n 's/^version: //p')" != "${package.version}" ]; then
            installer -pkg "${package}/Karabiner-Elements.pkg" -target /
          fi
        '';
      };

    homeManager = { lib, pkgs, ... }: {
      xdg.configFile."karabiner/karabiner.json" = lib.mkIf pkgs.stdenv.hostPlatform.isDarwin {
        text = builtins.toJSON {
          global.show_in_menu_bar = false;

          profiles = [
            {
              complex_modifications = {
                rules = [
                  {
                    description = "esc キーを押したときに、英数キーも送信する";

                    manipulators = [
                      {
                        from.key_code = "escape";

                        to = [
                          { key_code = "escape"; }
                          { key_code = "japanese_eisuu"; }
                        ];

                        type = "basic";
                      }
                    ];
                  }
                ];
              };

              name = "Default profile";
              selected = true;

              simple_modifications = [
                {
                  from.key_code = "caps_lock";

                  to = [ { key_code = "left_control"; } ];
                }
              ];

              virtual_hid_keyboard = {
                country_code = 0;
                keyboard_type_v2 = "ansi";
              };
            }
          ];
        };
      };
    };
  };
}
