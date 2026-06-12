{
  delib,
  lib,
  pkgs,
  ...
}:
delib.module {
  name = "programs.docker";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  home.ifEnabled = {
    home.packages = with pkgs; [
      docker
    ];

    home.activation.dockerContext = ''
      if ! ${lib.getExe pkgs.docker} context inspect socktainer > /dev/null 2>&1; then
        ${lib.getExe pkgs.docker} context create \
          --description socktainer \
          --docker "host=unix://$HOME/.socktainer/container.sock" \
          socktainer
      fi
      ${lib.getExe pkgs.docker} context use socktainer
    '';
  };
}
