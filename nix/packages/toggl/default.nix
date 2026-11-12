{
  lib,
  sources,
  stdenvNoCC,
  undmg,
  ...
}:
stdenvNoCC.mkDerivation {
  inherit (sources.toggl) pname version src;

  # Prebuilt, signed app bundle: skip fixup so nothing rewrites its binaries.
  dontFixup = true;

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

  nativeBuildInputs = [ undmg ];

  sourceRoot = ".";
}
