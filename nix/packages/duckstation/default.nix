{
  lib,
  stdenvNoCC,
  appimageTools,
  unzip,
  sources,
  ...
}:
let
  pname = "duckstation";

  meta = with lib; {
    description = "Fast PlayStation 1 emulator";
    homepage = "https://www.duckstation.org/";
    license = licenses.cc-by-nc-nd-40;
    platforms = [
      "aarch64-darwin"
      "aarch64-linux"
    ];
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
    mainProgram = pname;
  };

  darwin = stdenvNoCC.mkDerivation {
    inherit pname meta;
    inherit (sources.duckstation-darwin) version src;

    nativeBuildInputs = [ unzip ];

    sourceRoot = ".";

    # Keep the upstream code signature intact.
    dontFixup = true;

    installPhase = ''
      runHook preInstall
      mkdir -p "$out/Applications"
      cp -r DuckStation.app "$out/Applications/"
      runHook postInstall
    '';
  };

  linux = appimageTools.wrapType2 (finalAttrs: {
    inherit pname meta;
    inherit (sources.duckstation-linux) version src;

    extraInstallCommands = ''
      install -Dm444 -t $out/share/applications ${finalAttrs.contents}/org.duckstation.DuckStation.desktop
      substituteInPlace $out/share/applications/org.duckstation.DuckStation.desktop \
        --replace-fail 'TryExec=duckstation-qt' 'TryExec=${pname}' \
        --replace-fail 'Exec=duckstation-qt' 'Exec=${pname}'
      install -Dm444 -t $out/share/icons/hicolor/512x512/apps ${finalAttrs.contents}/org.duckstation.DuckStation.png
    '';
  });
in
if stdenvNoCC.hostPlatform.isDarwin then darwin else linux
