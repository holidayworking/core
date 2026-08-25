{ delib, pkgs, ... }:
let
  corepack = pkgs.runCommandLocal "corepack" { buildInputs = [ pkgs.nodejs ]; } ''
    mkdir -p $out/bin
    corepack enable --install-directory=$out/bin
  '';
in
delib.module {
  name = "programs.nodejs";

  home.always.home.packages = with pkgs; [
    nodejs
    corepack
  ];
}
