{
  lib,
  stdenvNoCC,
  undmg,
  sources,
  ...
}:
# Karabiner-Elements registers its background services from fixed paths
# (/Applications, /Library/Application Support/org.pqrs), so it cannot run
# from the Nix store. Only extract the official installer package here and let
# the programs.karabiner-elements module install it with installer(8).
stdenvNoCC.mkDerivation {
  inherit (sources.karabiner-elements) pname version src;

  nativeBuildInputs = [ undmg ];

  sourceRoot = ".";

  installPhase = ''
    runHook preInstall
    install -Dm644 Karabiner-Elements.pkg "$out/Karabiner-Elements.pkg"
    runHook postInstall
  '';

  meta = with lib; {
    description = "Utility for keyboard customization on macOS";
    homepage = "https://karabiner-elements.pqrs.org/";
    license = licenses.unlicense;
    platforms = platforms.darwin;
    sourceProvenance = with sourceTypes; [ binaryNativeCode ];
  };
}
