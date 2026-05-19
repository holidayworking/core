{ delib, pkgs, ... }:
delib.module {
  name = "programs.aws-sam-cli";

  home.always.home.packages = with pkgs; [
    aws-sam-cli
  ];
}
