{ delib, pkgs, ... }:
delib.module {
  name = "programs.codegraph";

  options = delib.singleEnableOption true;

  home.ifEnabled.home.packages = with pkgs; [
    llm-agents.codegraph
  ];
}
