{
  delib,
  host,
  lib,
  ...
}:
delib.module {
  name = "programs.1password-gui";

  options = delib.singleEnableOption host.isPC;

  nixos.ifEnabled =
    { myconfig, ... }:
    {
      programs._1password-gui = {
        enable = true;
        polkitPolicyOwners = [ myconfig.constants.username ];
      };
    };

  darwin.ifEnabled = {
    programs = {
      _1password-gui.enable = true;

      mas = {
        enable = true;
        packages."1Password for Safari" = 1569813296;
        update = false;
      };
    };
  };

  # 1Password rewrites settings.json itself, so it can't be a read-only
  # symlink; turn off "Install updates automatically" in place instead,
  # seeding the file before the first launch. The option only exists on macOS.
  home.ifEnabled = lib.optionalAttrs host.isDarwin {
    imports = [
      (
        { lib, pkgs, ... }:
        {
          home.activation.disable1PasswordAutoUpdate = lib.hm.dag.entryAfter [ "writeBoundary" ] ''
            settings="$HOME/Library/Group Containers/2BUA8C4S2C.com.1password/Library/Application Support/1Password/Data/settings/settings.json"
            # Leave an existing file alone (and say so) when it can't be read,
            # e.g. blocked by TCC, or parsed, rather than replacing it.
            current='{}'
            if [ -e "$settings" ]; then
              current="$(cat "$settings" 2>/dev/null)" || current=""
            fi
            if [ -z "$current" ]; then
              warnEcho "Cannot read $settings; 1Password auto-update was not disabled."
            elif ! ${lib.getExe pkgs.jq} -e '."updates.autoUpdate" == false' <<< "$current" >/dev/null 2>&1; then
              # Build the new contents before opening the file, so a jq failure
              # can't leave it truncated.
              if updated="$(${lib.getExe pkgs.jq} '."updates.autoUpdate" = false' <<< "$current" 2>/dev/null)"; then
                run mkdir -p "$(dirname "$settings")"
                (umask 077; printf '%s\n' "$updated" | run tee "$settings" >/dev/null)
              else
                warnEcho "Cannot parse $settings; 1Password auto-update was not disabled."
              fi
            fi
          '';
        }
      )
    ];
  };
}
