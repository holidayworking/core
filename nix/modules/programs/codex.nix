{ delib, pkgs, ... }:
delib.module {
  name = "programs.codex";

  options = delib.singleEnableOption true;

  home.ifEnabled = {
    imports = [
      (
        { config, lib, ... }:
        let
          configPath = ".codex/config.toml";
        in
        {
          # home-manager symlinks config.toml read-only into /nix/store, but
          # Codex writes trust_level entries into it when a directory is
          # trusted in the TUI, which fails against a read-only store path.
          # Disable that management and merge the nix-generated settings
          # into a writable copy on activation instead, mirroring
          # programs.zed-editor.mutableUserSettings.
          # https://github.com/nix-community/home-manager/issues/9397
          home.file.${configPath}.enable = false;

          home.activation.codexMutableConfig = lib.hm.dag.entryAfter [ "linkGeneration" ] ''
            configFile=${lib.escapeShellArg "${config.home.homeDirectory}/${configPath}"}
            staticConfig=${lib.escapeShellArg config.home.file.${configPath}.source}

            # Carry over Codex-written entries from the previous writable copy;
            # a symlink left by an older generation has nothing worth keeping.
            existingConfig=/dev/null
            if [ -f "$configFile" ] && [ ! -L "$configFile" ]; then
              existingConfig="$configFile"
            fi

            mergedConfig="$(mktemp)"
            ${lib.getExe pkgs.yq-go} -p toml -o toml eval-all \
              '. as $item ireduce ({}; . * $item)' \
              "$existingConfig" "$staticConfig" > "$mergedConfig"
            install -Dm644 "$mergedConfig" "$configFile"
            rm -f "$mergedConfig"
          '';
        }
      )
    ];

    programs.codex = {
      enable = true;

      enableMcpIntegration = true;

      settings = {
        plugins."deploy-on-aws@agent-plugins-for-aws".enabled = true;
        project_doc_fallback_filenames = [ "CLAUDE.md" ];

        marketplaces.agent-plugins-for-aws = {
          source_type = "git";
          source = "https://github.com/awslabs/agent-plugins.git";
        };
      };
    };
  };
}
