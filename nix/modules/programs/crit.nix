{
  delib,
  inputs,
  pkgs,
  ...
}:
delib.module {
  name = "programs.crit";

  options = delib.singleEnableOption true;

  home.ifEnabled.home.packages = [
    inputs.crit.packages.${pkgs.system}.default
  ];
}
