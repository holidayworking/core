{ delib, pkgs, ... }:
delib.module {
  name = "programs.vite-plus";

  home.always.home = {
    packages = with pkgs; [
      vite-plus
    ];
  };
}
