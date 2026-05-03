{ delib, pkgs, ... }:
delib.module {
  name = "programs.proto";

  home.always.home = {
    packages = with pkgs; [
      proto
    ];

    sessionPath = [
      "$PROTO_HOME/shims"
      "$PROTO_HOME/bin"
    ];

    sessionVariables = {
      PROTO_HOME = "$HOME/.proto";
    };
  };
}
