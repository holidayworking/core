{ delib, pkgs, ... }:
delib.module {
  name = "programs.codegraph";

  home.always.home.packages = [ pkgs.llm-agents.codegraph ];
}
