{
  # Some apps only honor a setting when it is forced through managed
  # preferences (a plain `defaults write` is ignored), and macOS no longer lets
  # a configuration profile be installed without approving it in System
  # Settings. So aspects declare the values in `managedPreferences`, and Nix
  # bundles them into a single profile and points at it until it is installed.
  den.aspects.base.darwin =
    { lib, config, ... }:
    let
      profileIdentifier = "com.github.holidayworking.core";
      profileEtcPath = "core/managed-preferences.mobileconfig";

      # PayloadUUIDs must stay stable across rebuilds, so derive them from the
      # payload identifiers.
      mkUuid =
        s:
        let
          h = lib.toUpper (builtins.hashString "sha256" s);
        in
        lib.concatStringsSep "-" [
          (lib.substring 0 8 h)
          (lib.substring 8 4 h)
          (lib.substring 12 4 h)
          (lib.substring 16 4 h)
          (lib.substring 20 12 h)
        ];

      mkPayload =
        domain: settings:
        let
          identifier = "${profileIdentifier}.${domain}";
        in
        settings
        // {
          PayloadDisplayName = domain;
          PayloadIdentifier = identifier;
          PayloadType = domain;
          PayloadUUID = mkUuid identifier;
          PayloadVersion = 1;
        };

      profile = lib.generators.toPlist { escape = true; } {
        PayloadDisplayName = "holidayworking/core";
        PayloadIdentifier = profileIdentifier;
        PayloadScope = "System";
        PayloadType = "Configuration";
        PayloadUUID = mkUuid profileIdentifier;
        PayloadVersion = 1;

        PayloadContent = lib.mapAttrsToList mkPayload config.managedPreferences;
      };

      # How `defaults read` prints each value.
      toDefaults = v: if lib.isBool v then (if v then "1" else "0") else toString v;

      mkCheck =
        domain: key: value:
        ''[ "$(/usr/bin/defaults read ${lib.escapeShellArg "/Library/Managed Preferences/${domain}"} ${lib.escapeShellArg key} 2>/dev/null)" = ${lib.escapeShellArg (toDefaults value)} ]'';

      checks = lib.flatten (
        lib.mapAttrsToList (domain: lib.mapAttrsToList (mkCheck domain)) config.managedPreferences
      );
    in
    {
      options.managedPreferences = lib.mkOption {
        type =
          with lib.types;
          attrsOf (
            attrsOf (oneOf [
              bool
              int
              str
            ])
          );

        default = { };

        description = "Preferences to force through the managed preferences profile, keyed by domain.";
      };

      config = lib.mkIf (config.managedPreferences != { }) {
        environment.etc.${profileEtcPath}.text = profile;

        system.activationScripts.postActivation.text = ''
          if ! { ${lib.concatStringsSep " && " checks}; }; then
            echo "Managed preferences are not applied: run 'open /etc/${profileEtcPath}', then install it in System Settings > General > Device Management." >&2
          fi
        '';
      };
    };
}
