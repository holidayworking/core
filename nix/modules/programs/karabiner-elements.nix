{ delib, pkgs, ... }:
delib.module {
  name = "programs.karabiner-elements";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "karabiner-elements"
  ];

  home.ifEnabled.xdg.configFile."karabiner/karabiner.json".text = builtins.toJSON {
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
}
