{
  lib,
  stdenvNoCC,
  fetchurl,
  undmg,
  ...
}:
stdenvNoCC.mkDerivation rec {
  pname = "toggl";
  version = "1.16.2";

  src = fetchurl {
    url = "https://toggl.com/toggl/desktop/downloads/Toggl-arm64.dmg";
    hash = "sha256-pgWpIVQIh7PJE9Z7qZ5I9sXxFapBefAtxLnXh/D5M3Q=";
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
