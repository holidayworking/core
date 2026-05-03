{ delib, pkgs, ... }:
delib.module {
  name = "programs.proto";

  home.always.home.packages = with pkgs; [
    proto
  ];
}
