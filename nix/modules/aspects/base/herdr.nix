{
  den.aspects.base.homeManager =
    {
      lib,
      pkgs,
      config,
      ...
    }:
    let
      herdr = lib.getExe config.programs.herdr.package;
      plugins = config.programs.herdr.plugins;
    in
    {
      options.programs.herdr.plugins = lib.mkOption {
        type = lib.types.listOf lib.types.package;
        default = [ ];
        description = "herdr plugins to link on activation.";
      };

      config = {
        # `herdr plugin link` records plugins in herdr's own plugins.json, which it
        # also rewrites itself, so link on every activation instead of owning the file.
        # Plugins linked from the store but no longer declared are unlinked, so no
        # entry is left pointing at a garbage-collected path. A herdr error only
        # warns: plugin registration must not abort the rest of the activation.
        home.activation.herdrPlugins = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
          ${lib.concatMapStrings (plugin: ''
            run ${herdr} plugin link ${plugin} >/dev/null \
              || warnEcho "herdr: failed to link ${plugin}"
          '') plugins}
          plugins_json=${lib.escapeShellArg "${config.xdg.configHome}/herdr/plugins.json"}
          if [ -f "$plugins_json" ]; then
            stale=$(${lib.getExe pkgs.jq} -r \
              --argjson keep ${lib.escapeShellArg (builtins.toJSON (map toString plugins))} \
              '.[] | select(.plugin_root | startswith("/nix/store/"))
                | select(.plugin_root as $root | $keep | index($root) | not)
                | .plugin_id' "$plugins_json") \
              || warnEcho "herdr: failed to read $plugins_json"
            for id in $stale; do
              run ${herdr} plugin unlink "$id" >/dev/null \
                || warnEcho "herdr: failed to unlink $id"
            done
          fi
        '';

        programs.herdr = {
          enable = true;

          plugins = [
            pkgs.local.herdr-gitview
            pkgs.local.herdr-nvim
          ];

          settings = {
            keys = {
              prefix = "ctrl+t";

              command = [
                {
                  command = "chmarax.gitview.toggle";
                  description = "git view sidebar";
                  key = "prefix+d";
                  type = "plugin_action";
                }
                {
                  command = "chmarax.gitview.toggle-tab";
                  description = "git view tab";
                  key = "prefix+t";
                  type = "plugin_action";
                }
                {
                  command = "chmarax.herdr-nvim.pick-file";
                  description = "open file from agent output";
                  key = "prefix+f";
                  type = "plugin_action";
                }
                {
                  command = "chmarax.herdr-nvim.toggle";
                  description = "nvim sidebar";
                  key = "prefix+e";
                  type = "plugin_action";
                }
              ];

              # Moved off prefix+e for herdr-nvim.
              edit_scrollback = "prefix+shift+e";
            };

            onboarding = false;
            theme.name = "terminal";
          };
        };
      };
    };
}
