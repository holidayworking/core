{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.codegraph";

  options = delib.singleEnableOption host.isPC;

  home.ifEnabled.home.packages = [ pkgs.llm-agents.codegraph ];
}
