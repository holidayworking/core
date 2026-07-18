{
  delib,
  ...
}:
delib.module {
  name = "programs.foot";

  options = delib.singleEnableOption false;

  home.ifEnabled.programs.foot = {
    enable = true;
    settings.main.font = "FiraCode Nerd Font:size=14";
  };
}
