{ delib, ... }:
delib.module {
  name = "constants";

  options.constants = with delib; {
    username = readOnly (strOption "hidekazu");
    userfullname = readOnly (strOption "Hidekazu Tanaka");
    useremail = readOnly (strOption "11025+holidayworking@users.noreply.github.com");
    authorizedKeys = readOnly (
      listOfOption str [
        "ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIL8Zoej4KoXnIYd9g2ocJXHyYAtNUlaSWtq84aIuAFhq"
      ]
    );
  };
}
