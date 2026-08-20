{
  delib,
  inputs,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.crit";

  options = delib.singleEnableOption host.aiFeatured;

  home.ifEnabled.home.packages = [
    inputs.crit.packages.${pkgs.stdenv.hostPlatform.system}.default
  ];
}
