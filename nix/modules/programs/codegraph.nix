{
  delib,
  host,
  pkgs,
  ...
}:
delib.module {
  name = "programs.codegraph";

  options = delib.singleEnableOption host.aiFeatured;

  home.ifEnabled.home.packages = with pkgs; [
    llm-agents.codegraph
  ];
}
