{ den, ... }:
let
  fullName = "Hidekazu Tanaka";
in
{
  den.aspects.hidekazu = {
    includes = [
      # Hosts include the features, and den delivers their homeManager config to
      # a user only through this battery.
      den.batteries.host-aspects
      den.batteries.primary-user
      (den.batteries.user-shell "zsh")
    ];

    homeManager.programs.git.settings.user = {
      email = "11025+holidayworking@users.noreply.github.com";
      name = fullName;
    };

    provides.to-hosts.nixos.users = {
      groups.hidekazu.gid = 1000;

      users.hidekazu = {
        description = fullName;
        group = "hidekazu";

        openssh.authorizedKeys.keys = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8Zoej4KoXnIYd9g2ocJXHyYAtNUlaSWtq84aIuAFhq"
        ];

        uid = 1000;
      };
    };
  };
}
