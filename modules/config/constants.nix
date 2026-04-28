{ delib, lib, ... }:
delib.module {
  name = "constants";

  options.constants = with delib; {
    username = readOnly (strOption "hidekazu");
    userfullname = readOnly (strOption "Hidekazu Tanaka");
    authorizedKeys = readOnly (
      lib.mkOption {
        type = lib.types.listOf lib.types.str;
        default = [
          "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8Zoej4KoXnIYd9g2ocJXHyYAtNUlaSWtq84aIuAFhq"
        ];
      }
    );
  };
}
