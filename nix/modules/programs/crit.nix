{
  delib,
  host,
  inputs,
  ...
}:
delib.module {
  name = "programs.crit";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = [
    inputs.crit.packages.${host.system}.default
  ];
}
