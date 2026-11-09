{
  lib,
  stdenvNoCC,
  unzip,
  sources,
  ...
}:
stdenvNoCC.mkDerivation {
  pname = "claude";
  # nvfetcher tracks the full download URL as the version; extract the real one.
  version = lib.head (
    builtins.match ".*/universal/([0-9.]+)/Claude-[0-9a-f]+\\.zip" sources.claude.version
  );
  inherit (sources.claude) src;

  nativeBuildInputs = [ unzip ];

  sourceRoot = ".";

  # Prebuilt, signed app bundle: skip fixup so nothing rewrites its binaries.
  dontFixup = true;

  installPhase = ''
    runHook preInstall
    mkdir -p "$out/Applications"
    mv Claude.app "$out/Applications/"
    runHook postInstall
  '';

  meta = with lib; {
    description = "Anthropic's official Claude AI desktop app";
    homepage = "https://claude.com/download";
    license = licenses.unfree;
    platforms = platforms.darwin;
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
  };
}
