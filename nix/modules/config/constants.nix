{ delib, ... }:
let
  username = "hidekazu";
in
delib.module {
  name = "constants";

  options.constants = with delib; {
    username = readOnly (strOption username);
    userfullname = readOnly (strOption "Hidekazu Tanaka");
    useremail = readOnly (strOption "11025+holidayworking@users.noreply.github.com");
    homeDirectory = readOnly (strOption "/Users/${username}");
  };
}
