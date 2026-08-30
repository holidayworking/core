{
  delib,
  host,
  inputs,
  ...
}:
delib.module {
  name = "programs.crit";

  options = delib.singleEnableOption host.aiFeatured;

  home.ifEnabled.home.packages = [
    inputs.crit.packages.${host.system}.default
  ];
}
