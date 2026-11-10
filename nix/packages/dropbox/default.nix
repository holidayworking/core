{
  lib,
  stdenvNoCC,
  undmg,
  sources,
  ...
}:
stdenvNoCC.mkDerivation {
  inherit (sources.dropbox) pname version src;

  nativeBuildInputs = [ undmg ];

  sourceRoot = ".";

  # Prebuilt, signed app bundle: skip fixup so nothing rewrites its binaries.
  dontFixup = true;

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/Applications"
    mv Dropbox.app "$out/Applications/"
    runHook postInstall
  '';

  meta = with lib; {
    description = "Client for the Dropbox cloud storage service";
    homepage = "https://www.dropbox.com/";
    license = licenses.unfree;
    platforms = [ "aarch64-darwin" ];
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
  };
}
