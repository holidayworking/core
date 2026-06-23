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
      if ! ${lib.getExe pkgs.docker} context inspect lima > /dev/null 2>&1; then
        ${lib.getExe pkgs.docker} context create \
          --description lima \
          --docker "host=unix://$HOME/.lima/default/sock/docker.sock" \
          lima
      fi
      ${lib.getExe pkgs.docker} context use lima
    '';
  };
}
