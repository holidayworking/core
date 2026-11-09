{
  lib,
  stdenvNoCC,
  undmg,
  sources,
  ...
}:
stdenvNoCC.mkDerivation {
  pname = "multiviewer";
  # nvfetcher tracks the full download URL as the version; extract the real one.
  version = lib.head (
    builtins.match ".*/MultiViewer-([0-9.]+)-arm64\\.dmg" sources.multiviewer.version
  );
  inherit (sources.multiviewer) src;

  nativeBuildInputs = [ undmg ];

  sourceRoot = ".";

  # Prebuilt, signed app bundle: skip fixup so nothing rewrites its binaries.
  dontFixup = true;

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/Applications"
    mv ./*.app "$out/Applications/"
    runHook postInstall
  '';

  meta = with lib; {
    description = "Unofficial desktop client for F1 TV";
    homepage = "https://multiviewer.app/";
    license = licenses.unfree;
    platforms = [ "aarch64-darwin" ];
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
  };
}
