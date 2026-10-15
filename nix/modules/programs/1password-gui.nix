{ delib, host, ... }:
delib.module {
  name = "programs.1password-gui";

  options = delib.singleEnableOption host.isPC;

  nixos.ifEnabled =
    { myconfig, ... }:
    {
      programs._1password-gui = {
        enable = true;
        polkitPolicyOwners = [ myconfig.constants.username ];
      };
    };

  darwin.ifEnabled = {
    homebrew.masApps."1Password for Safari" = 1569813296;
    programs._1password-gui.enable = true;
  };
}
