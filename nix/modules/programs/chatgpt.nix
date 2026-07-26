{ delib, pkgs, ... }:
delib.module {
  name = "programs.chatgpt";

  options = delib.singleEnableOption pkgs.stdenv.isDarwin;

  darwin.ifEnabled.homebrew.casks = [
    "chatgpt"
  ];
}
