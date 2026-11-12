{ den, ... }:
{
  den.hosts.aarch64-darwin.taurus.users.hidekazu = { };

  den.aspects.taurus.includes = with den.aspects; [
    ai
    desktop
  ];
}
