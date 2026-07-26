{
  delib,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.crit";

  home.always.home.packages = [
    inputs.crit.packages.${pkgs.system}.default
  ];
}
