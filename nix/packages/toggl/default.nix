{
  lib,
  stdenvNoCC,
  fetchurl,
  undmg,
  ...
}:
stdenvNoCC.mkDerivation rec {
  pname = "toggl";
  version = "1.6.1";

  src = fetchurl {
    url = "https://toggl.com/toggl/desktop/downloads/Toggl-arm64.dmg";
    hash = "sha256-T+Ox8OSD2gPY7HVoTBbPClz1Y3B17pmNvl7B5lgoWqw=";
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
