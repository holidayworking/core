{
  lib,
  stdenvNoCC,
  fetchurl,
  undmg,
  ...
}:
stdenvNoCC.mkDerivation rec {
  pname = "toggl";
  version = "1.4.4";

  src = fetchurl {
    url = "https://toggl.com/toggl/desktop/downloads/Toggl-arm64.dmg";
    hash = "sha256-fENFMOEfEfsb1JmnzkMPNgnAKLuHRC+WMbt45HXZJQE=";
  };

  nativeBuildInputs = [ undmg ];

  sourceRoot = ".";

  dontPatchShebangs = true;

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/Applications"
    cp -r ./*.app "$out/Applications/"
    runHook postInstall
  '';

  meta = with lib; {
    description = "Time tracking app";
    homepage = "https://toggl.com/track/";
    license = licenses.unfree;
    platforms = platforms.darwin;
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
  };
}
