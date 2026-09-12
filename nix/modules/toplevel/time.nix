{ delib, ... }:
delib.module {
  name = "time";

  nixos.always.time.timeZone = "Asia/Tokyo";
}
