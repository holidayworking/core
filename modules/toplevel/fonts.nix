{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "fonts";

  options = delib.singleEnableOption host.isDesktop;

  darwin.ifEnabled.fonts.packages = with pkgs; [
    nerd-fonts.fira-code
  ];
}
