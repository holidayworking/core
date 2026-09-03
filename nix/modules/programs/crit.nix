{
  delib,
  host,
  inputs,
  ...
}:
delib.module {
  name = "programs.crit";

  home.always.home.packages = [
    inputs.crit.packages.${host.system}.default
  ];
}
